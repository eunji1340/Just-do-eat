/**
 * main/service/command/MainCommandServiceImpl.java
 * 메인 Command 서비스 구현체
 * Author: Jang
 * Date: 2025-11-04
 */

package com.jde.mainserver.main.service.command;

import com.jde.mainserver.main.entity.SwipeAction;
import com.jde.mainserver.main.entity.UserRestaurantEvent;
import com.jde.mainserver.main.exception.MainErrorCode;
import com.jde.mainserver.main.exception.MainException;
import com.jde.mainserver.main.repository.UserRestaurantEventRepository;
import com.jde.mainserver.main.repository.UserRestaurantStateRepository;
import com.jde.mainserver.main.repository.UserTagPrefRepository;
import com.jde.mainserver.main.web.dto.request.SwipeRequest;
import com.jde.mainserver.main.web.dto.response.SwipeResponse;
import com.jde.mainserver.restaurants.exception.RestaurantErrorCode;
import com.jde.mainserver.restaurants.exception.RestaurantException;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.restaurants.repository.RestaurantTagRepository;
import com.jde.mainserver.restaurants.web.dto.response.BookmarkResponse;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
public class MainCommandServiceImpl implements MainCommandService {

	private final UserRestaurantEventRepository eventRepository;
	private final UserRestaurantStateRepository stateRepository;
	private final RestaurantRepository restaurantRepository;
	private final RestaurantTagRepository restaurantTagRepository;
	private final UserTagPrefRepository userTagPrefRepository;

	public MainCommandServiceImpl(
		UserRestaurantEventRepository eventRepository,
		UserRestaurantStateRepository stateRepository,
		RestaurantRepository restaurantRepository,
		RestaurantTagRepository restaurantTagRepository,
		UserTagPrefRepository userTagPrefRepository
	) {
		this.eventRepository = eventRepository;
		this.stateRepository = stateRepository;
		this.restaurantRepository = restaurantRepository;
		this.restaurantTagRepository = restaurantTagRepository;
		this.userTagPrefRepository = userTagPrefRepository;
	}

	@Transactional
	@Override
	public SwipeResponse handleSwipe(Long userId, SwipeRequest request) {
		final Long restaurantId = request.getRestaurantId();
		final SwipeAction action = request.getAction();
		final Instant now = Instant.now();

		// 레스토랑 존재 검증
		if (!restaurantRepository.existsById(restaurantId)) {
			throw new MainException(MainErrorCode.NOT_FOUND_RESTAURANT);
		}

		// 1) 이벤트 저장 (append-only)
		UserRestaurantEvent event = UserRestaurantEvent.builder()
			.userId(userId)
			.restaurantId(restaurantId)
			.eventType(action)
			.build();
		eventRepository.save(event);

		// 2) 상태 upsert (동시성 안전하게 ON CONFLICT 사용)
		boolean isSaved = false; // 신규 insert 기본값은 false

		// 액션별 선호 점수 증분 규칙
		java.math.BigDecimal prefDelta;
		java.time.Instant cooldownUntil = null;
		if (action == SwipeAction.SELECT) {
			prefDelta = new java.math.BigDecimal("0.800");
		} else if (action == SwipeAction.DISLIKE) {
			prefDelta = new java.math.BigDecimal("-1.000");
			// DISLIKE 시 쿨다운 종료 시각 설정 (7일 후)
			cooldownUntil = now.plus(java.time.Duration.ofDays(7));
		} else { // HOLD
			prefDelta = new java.math.BigDecimal("-0.100");
		}

		// 신규 생성 시 초기값은 증분과 동일하게 부여
		java.math.BigDecimal prefInit = prefDelta;

		stateRepository.upsertBasic(
			userId,
			restaurantId,
			isSaved,
			action.name(),
			now,
			prefInit,
			prefDelta,
			false,
			cooldownUntil
		);

		// 3) 태그 선호 업데이트 (restaurant_tag 기반으로 분배)
		var tagRows = restaurantTagRepository.findByRestaurantId(restaurantId);
		// 액션별 태그 점수/신뢰도 증분
		java.math.BigDecimal tagDeltaScore;
		java.math.BigDecimal tagDeltaConf;
		if (action == SwipeAction.SELECT) {
			tagDeltaScore = new java.math.BigDecimal("0.15");
			tagDeltaConf = new java.math.BigDecimal("0.30");
		} else if (action == SwipeAction.DISLIKE) {
			tagDeltaScore = new java.math.BigDecimal("-0.20");
			tagDeltaConf = new java.math.BigDecimal("0.30");
		} else { // HOLD (SAVE 별도 액션 미도입 상황)
			tagDeltaScore = new java.math.BigDecimal("-0.02");
			tagDeltaConf = new java.math.BigDecimal("0.05");
		}

		// 1/sqrt(1+n) 완충은 DB 집계 필요하므로 MVP에선 균등 분배로 단순화
		for (var rt : tagRows) {
			userTagPrefRepository.upsertIncrement(
				userId,
				rt.getTagId(),
				java.math.BigDecimal.ZERO, // 신규 생성 시 0에서 시작
				java.math.BigDecimal.ZERO,
				tagDeltaScore,
				tagDeltaConf
			);
		}

		// 개인 선호 점수 조회
		Double prefScore = null;
		var stateKey = new com.jde.mainserver.main.entity.UserRestaurantState.Key(userId, restaurantId);
		var state = stateRepository.findById(stateKey).orElse(null);
		if (state != null && state.getPrefScore() != null) {
			prefScore = state.getPrefScore().doubleValue();
		}

		// 응답 구성
		return new SwipeResponse(
			userId,
			restaurantId,
			isSaved,
			action,
			now,
			prefScore
		);
	}

	@Transactional
	@Override
	public BookmarkResponse addBookmark(Long restaurantId, Long userId) {
		return updateBookmark(restaurantId, userId, true);
	}

	@Transactional
	@Override
	public BookmarkResponse removeBookmark(Long restaurantId, Long userId) {
		return updateBookmark(restaurantId, userId, false);
	}

	/**
	 * 즐겨찾기 상태를 업데이트하는 공통 메서드
	 *
	 * @param restaurantId 식당 ID
	 * @param userId 사용자 ID
	 * @param isSaved 즐겨찾기 추가(true) 또는 해제(false)
	 * @return 처리 결과 및 최신 상태 스냅샷을 담은 응답 DTO
	 */
	private BookmarkResponse updateBookmark(Long restaurantId, Long userId, boolean isSaved) {
		final Instant now = Instant.now();

		// 레스토랑 존재 검증
		if (!restaurantRepository.existsById(restaurantId)) {
			throw new RestaurantException(RestaurantErrorCode.NOT_FOUND_RESTAURANT);
		}

		// 현재 상태 조회
		var stateKey = new com.jde.mainserver.main.entity.UserRestaurantState.Key(userId, restaurantId);
		var existingState = stateRepository.findById(stateKey).orElse(null);
		boolean currentIsSaved = existingState != null && Boolean.TRUE.equals(existingState.getIsSaved());

		// 이미 같은 상태인지 확인 (중복 요청 방지)
		if (currentIsSaved == isSaved) {
			// 상태가 변경되지 않았으므로 점수 변경 없이 현재 상태 반환
			Double prefScore = null;
			if (existingState != null && existingState.getPrefScore() != null) {
				prefScore = existingState.getPrefScore().doubleValue();
			}
			return new BookmarkResponse(
				userId,
				restaurantId,
				isSaved,
				prefScore
			);
		}

		// 즐겨찾기 추가/해제에 따른 선호 점수 증분
		java.math.BigDecimal prefDelta;
		if (isSaved) {
			// 즐겨찾기 추가: 개인 점수 증가
			prefDelta = new java.math.BigDecimal("0.500");
		} else {
			// 즐겨찾기 해제: 조건부 감점
			// 기존 상태가 is_saved = true인 경우에만 감점 적용
			// (기존 상태가 없거나 이미 false인 경우는 위에서 이미 반환됨)
			if (currentIsSaved) {
				// 기존 상태가 true에서 false로 변경되는 경우 감점
				prefDelta = new java.math.BigDecimal("-0.500");
			} else {
				// 기존 상태가 없거나 이미 false인 경우 점수 변경 없음
				// (이 경우는 위에서 이미 반환되지만, 안전을 위해 처리)
				prefDelta = java.math.BigDecimal.ZERO;
			}
		}

		// 신규 생성 시 초기값은 증분과 동일하게 부여
		java.math.BigDecimal prefInit = prefDelta;

		// 상태 upsert (is_saved 업데이트 포함)
		stateRepository.upsertBasic(
			userId,
			restaurantId,
			isSaved,
			existingState != null && existingState.getLastSwipe() != null 
				? existingState.getLastSwipe().name() 
				: null,
			existingState != null && existingState.getLastSwipeAt() != null
				? existingState.getLastSwipeAt()
				: now,
			prefInit,
			prefDelta,
			true, // updateSaved = true로 설정하여 is_saved 업데이트
			null  // cooldownUntil은 변경하지 않음
		);

		// 태그 선호 업데이트 (restaurant_tag 기반으로 분배)
		// 상태가 변경될 때만 태그 선호도 업데이트
		// 즐겨찾기 해제 시 조건부로만 태그 선호도 업데이트 (기존 상태가 true인 경우만)
		if (prefDelta.compareTo(java.math.BigDecimal.ZERO) != 0) {
			var tagRows = restaurantTagRepository.findByRestaurantId(restaurantId);
			// 즐겨찾기 추가/해제에 따른 태그 점수/신뢰도 증분
			java.math.BigDecimal tagDeltaScore;
			java.math.BigDecimal tagDeltaConf;
			if (isSaved) {
				// 즐겨찾기 추가: 태그 선호도 증가 (SELECT보다는 약간 낮게)
				tagDeltaScore = new java.math.BigDecimal("0.10");
				tagDeltaConf = new java.math.BigDecimal("0.20");
			} else {
				// 즐겨찾기 해제: 태그 선호도 감소 (기존 상태가 true에서 false로 변경되는 경우만)
				// "좋다고 했다가 다시 접는 패턴"을 학습 신호로 사용
				tagDeltaScore = new java.math.BigDecimal("-0.10");
				tagDeltaConf = new java.math.BigDecimal("0.10");
			}

			// 태그 선호도 업데이트
			for (var rt : tagRows) {
				userTagPrefRepository.upsertIncrement(
					userId,
					rt.getTagId(),
					java.math.BigDecimal.ZERO, // 신규 생성 시 0에서 시작
					java.math.BigDecimal.ZERO,
					tagDeltaScore,
					tagDeltaConf
				);
			}
		}

		// 개인 선호 점수 조회
		Double prefScore = null;
		var updatedState = stateRepository.findById(stateKey).orElse(null);
		if (updatedState != null && updatedState.getPrefScore() != null) {
			prefScore = updatedState.getPrefScore().doubleValue();
		}

		// 응답 구성
		return new BookmarkResponse(
			userId,
			restaurantId,
			isSaved,
			prefScore
		);
	}

	@Transactional
	@Override
	public void handleView(Long restaurantId, Long userId) {
		// 레스토랑 존재 검증
		if (!restaurantRepository.existsById(restaurantId)) {
			throw new RestaurantException(RestaurantErrorCode.NOT_FOUND_RESTAURANT);
		}

		// 현재 상태 조회
		var stateKey = new com.jde.mainserver.main.entity.UserRestaurantState.Key(userId, restaurantId);
		var existingState = stateRepository.findById(stateKey).orElse(null);

		// view_count 기반 점수 계산
		int currentViewCount = existingState != null ? existingState.getViewCount() : 0;
		java.math.BigDecimal prefDelta;

		if (currentViewCount == 0) {
			// 첫 상세 조회: +0.10
			prefDelta = new java.math.BigDecimal("0.10");
		} else if (currentViewCount >= 1 && currentViewCount <= 2) {
			// 2~3회 재조회: 회당 +0.03씩 추가
			prefDelta = new java.math.BigDecimal("0.03");
		} else {
			// 최대 가산 한도 도달 (view_count >= 3): 더 이상 증가하지 않음
			// view_count만 증가시키고 점수는 변경하지 않음
			prefDelta = java.math.BigDecimal.ZERO;
		}

		// 상태 업데이트 (view_count 증가 및 점수 업데이트)
		stateRepository.upsertView(userId, restaurantId, prefDelta);

		// 태그 선호도 업데이트 (view로 인한 증가분만큼)
		if (prefDelta.compareTo(java.math.BigDecimal.ZERO) > 0) {
			var tagRows = restaurantTagRepository.findByRestaurantId(restaurantId);
			// view는 약한 positive 신호이므로 태그 점수도 작게 증가
			java.math.BigDecimal tagDeltaScore = prefDelta.multiply(new java.math.BigDecimal("0.5")); // view 점수의 50%
			java.math.BigDecimal tagDeltaConf = prefDelta.multiply(new java.math.BigDecimal("0.3")); // view 점수의 30%

			for (var rt : tagRows) {
				userTagPrefRepository.upsertIncrement(
					userId,
					rt.getTagId(),
					java.math.BigDecimal.ZERO,
					java.math.BigDecimal.ZERO,
					tagDeltaScore,
					tagDeltaConf
				);
			}
		}
	}

	@Transactional
	@Override
	public void handleShare(Long restaurantId, Long userId) {
		// 레스토랑 존재 검증
		if (!restaurantRepository.existsById(restaurantId)) {
			throw new RestaurantException(RestaurantErrorCode.NOT_FOUND_RESTAURANT);
		}

		// 현재 상태 조회
		var stateKey = new com.jde.mainserver.main.entity.UserRestaurantState.Key(userId, restaurantId);
		var existingState = stateRepository.findById(stateKey).orElse(null);

		// share_count 기반 점수 계산
		int currentShareCount = existingState != null ? existingState.getShareCount() : 0;
		java.math.BigDecimal prefDelta;

		if (currentShareCount == 0) {
			// 첫 공유: +0.6
			prefDelta = new java.math.BigDecimal("0.6");
		} else if (currentShareCount >= 1 && currentShareCount <= 2) {
			// 추가 공유: 회당 +0.1 (최대 2회까지)
			prefDelta = new java.math.BigDecimal("0.1");
		} else {
			// 최대 가산 한도 도달 (share_count >= 3): 더 이상 증가하지 않음
			// share_count만 증가시키고 점수는 변경하지 않음
			prefDelta = java.math.BigDecimal.ZERO;
		}

		// 상태 업데이트 (share_count 증가 및 점수 업데이트)
		stateRepository.upsertShare(userId, restaurantId, prefDelta);

		// 태그 선호도 업데이트 (share로 인한 증가분만큼)
		if (prefDelta.compareTo(java.math.BigDecimal.ZERO) > 0) {
			var tagRows = restaurantTagRepository.findByRestaurantId(restaurantId);
			// share는 강한 positive 신호이므로 태그 점수도 크게 증가
			java.math.BigDecimal tagDeltaScore = prefDelta.multiply(new java.math.BigDecimal("0.8")); // share 점수의 80%
			java.math.BigDecimal tagDeltaConf = prefDelta.multiply(new java.math.BigDecimal("0.6")); // share 점수의 60%

			for (var rt : tagRows) {
				userTagPrefRepository.upsertIncrement(
					userId,
					rt.getTagId(),
					java.math.BigDecimal.ZERO,
					java.math.BigDecimal.ZERO,
					tagDeltaScore,
					tagDeltaConf
				);
			}
		}
	}

	@Transactional
	@Override
	public com.jde.mainserver.main.web.dto.response.VisitFeedbackResponse handleVisitFeedback(
		Long restaurantId,
		Long userId,
		Boolean isVisited,
		String satisfaction
	) {
		final Instant now = Instant.now();

		// 레스토랑 존재 검증
		if (!restaurantRepository.existsById(restaurantId)) {
			throw new MainException(MainErrorCode.NOT_FOUND_RESTAURANT);
		}

		// 방문 안 함인 경우
		if (Boolean.FALSE.equals(isVisited)) {
			// is_visited = false로 설정, 점수 변화 없음
			stateRepository.upsertVisitFeedback(
				userId,
				restaurantId,
				false,
				java.math.BigDecimal.ZERO,
				null
			);

			// 최신 상태 조회
			var stateKey = new com.jde.mainserver.main.entity.UserRestaurantState.Key(userId, restaurantId);
			var state = stateRepository.findById(stateKey).orElse(null);
			java.math.BigDecimal prefScore = state != null ? state.getPrefScore() : java.math.BigDecimal.ZERO;

			return com.jde.mainserver.main.web.dto.response.VisitFeedbackResponse.builder()
				.userId(userId)
				.restaurantId(restaurantId)
				.isVisited(false)
				.prefScore(prefScore)
				.build();
		}

		// 방문함인 경우 만족도에 따라 점수 조정
		java.math.BigDecimal prefDelta;
		java.time.Instant cooldownUntil = null;
		java.math.BigDecimal tagDeltaScore;
		java.math.BigDecimal tagDeltaConf;

		if ("LIKE".equals(satisfaction)) {
			// 방문 + 좋았어요: pref_score += 1.0, 태그 score += 0.20, confidence += 0.20
			prefDelta = new java.math.BigDecimal("1.0");
			tagDeltaScore = new java.math.BigDecimal("0.20");
			tagDeltaConf = new java.math.BigDecimal("0.20");
		} else if ("NEUTRAL".equals(satisfaction)) {
			// 방문 + 그냥 그랬어요: pref_score += 0.1, 태그 score += 0.02
			prefDelta = new java.math.BigDecimal("0.1");
			tagDeltaScore = new java.math.BigDecimal("0.02");
			tagDeltaConf = java.math.BigDecimal.ZERO;
		} else if ("DISLIKE".equals(satisfaction)) {
			// 방문 + 별로였어요: pref_score += -1.0, cooldown_until = now + 30일, 태그 score -= 0.20, confidence += 0.20
			prefDelta = new java.math.BigDecimal("-1.0");
			cooldownUntil = now.plus(java.time.Duration.ofDays(30));
			tagDeltaScore = new java.math.BigDecimal("-0.20");
			tagDeltaConf = new java.math.BigDecimal("0.20");
		} else {
			// 만족도가 null이거나 잘못된 값인 경우 기본값 (그냥 그랬어요와 동일)
			prefDelta = new java.math.BigDecimal("0.1");
			tagDeltaScore = new java.math.BigDecimal("0.02");
			tagDeltaConf = java.math.BigDecimal.ZERO;
		}

		// 상태 업데이트
		stateRepository.upsertVisitFeedback(
			userId,
			restaurantId,
			true,
			prefDelta,
			cooldownUntil
		);

		// 태그 선호도 업데이트
		if (tagDeltaScore.compareTo(java.math.BigDecimal.ZERO) != 0 || tagDeltaConf.compareTo(java.math.BigDecimal.ZERO) != 0) {
			var tagRows = restaurantTagRepository.findByRestaurantId(restaurantId);
			for (var rt : tagRows) {
				userTagPrefRepository.upsertIncrement(
					userId,
					rt.getTagId(),
					java.math.BigDecimal.ZERO,
					java.math.BigDecimal.ZERO,
					tagDeltaScore,
					tagDeltaConf
				);
			}
		}

		// 최신 상태 조회
		var stateKey = new com.jde.mainserver.main.entity.UserRestaurantState.Key(userId, restaurantId);
		var state = stateRepository.findById(stateKey).orElse(null);
		java.math.BigDecimal prefScore = state != null ? state.getPrefScore() : prefDelta;

		return com.jde.mainserver.main.web.dto.response.VisitFeedbackResponse.builder()
			.userId(userId)
			.restaurantId(restaurantId)
			.isVisited(true)
			.prefScore(prefScore)
			.build();
	}
}

