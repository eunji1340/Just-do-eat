/**
 * main/service/command/MainCommandServiceImpl.java
 * 메인 Command 서비스 구현체
 * Author: Jang
 * Date: 2025-11-04
 */

package com.jde.mainserver.main.service.command;

import com.jde.mainserver.main.entity.enums.SwipeAction;
import com.jde.mainserver.main.entity.UserRestaurantEvent;
import com.jde.mainserver.main.entity.UserRestaurantState;
import com.jde.mainserver.main.exception.MainErrorCode;
import com.jde.mainserver.main.exception.MainException;
import com.jde.mainserver.main.repository.UserRestaurantEventRepository;
import com.jde.mainserver.main.repository.UserRestaurantStateRepository;
import com.jde.mainserver.main.repository.UserTagPrefRepository;
import com.jde.mainserver.main.web.dto.request.SwipeRequest;
import com.jde.mainserver.main.web.dto.response.SwipeResponse;
import com.jde.mainserver.main.web.dto.response.VisitFeedbackResponse;
import com.jde.mainserver.restaurants.exception.RestaurantErrorCode;
import com.jde.mainserver.restaurants.exception.RestaurantException;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.restaurants.repository.RestaurantTagRepository;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
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

		// 현재 상태 조회 (최근성 가중치 계산용)
		var stateKey = new UserRestaurantState.Key(userId, restaurantId);
		var existingState = stateRepository.findById(stateKey).orElse(null);
		boolean isRecentSelect = false;
		if (existingState != null 
			&& existingState.getLastSwipe() == SwipeAction.SELECT 
			&& existingState.getLastSwipeAt() != null) {
			Instant sevenDaysAgo = now.minus(Duration.ofDays(7));
			isRecentSelect = existingState.getLastSwipeAt().isAfter(sevenDaysAgo);
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
		BigDecimal prefDelta;
		Instant cooldownUntil = null;
		if (action == SwipeAction.SELECT) {
			prefDelta = new BigDecimal("0.800");
			// 최근 7일 내 SELECT에는 +10% 가중치 적용
			if (isRecentSelect) {
				prefDelta = prefDelta.multiply(new BigDecimal("1.1"));
			}
		} else if (action == SwipeAction.DISLIKE) {
			prefDelta = new BigDecimal("-1.000");
			// DISLIKE 시 쿨다운 종료 시각 설정 (7일 후)
			cooldownUntil = now.plus(Duration.ofDays(7));
		} else { // HOLD
			prefDelta = new BigDecimal("-0.05");
		}

		// 신규 생성 시 초기값은 증분과 동일하게 부여
		BigDecimal prefInit = prefDelta;

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
		BigDecimal tagDeltaScore;
		BigDecimal tagDeltaConf;
		if (action == SwipeAction.SELECT) {
			tagDeltaScore = new BigDecimal("0.15");
			tagDeltaConf = new BigDecimal("0.30");
		} else if (action == SwipeAction.DISLIKE) {
			tagDeltaScore = new BigDecimal("-0.20");
			tagDeltaConf = new BigDecimal("0.20");
		} else { // HOLD
			tagDeltaScore = BigDecimal.ZERO;
			tagDeltaConf = BigDecimal.ZERO;
		}

		// 1/sqrt(1+n) 완충은 DB 집계 필요하므로 MVP에선 균등 분배로 단순화
		for (var rt : tagRows) {
			// 신규 생성 시 초기값은 증분과 동일하게 부여 (INSERT 시 initScore/initConf 사용)
			// 업데이트 시에는 deltaScore/deltaConf를 더함
			userTagPrefRepository.upsertIncrement(
				userId,
				rt.getTagId(),
				tagDeltaScore,  // initScore: 신규 생성 시 초기값
				tagDeltaConf,   // initConf: 신규 생성 시 초기값
				tagDeltaScore,  // deltaScore: 업데이트 시 증분
				tagDeltaConf    // deltaConf: 업데이트 시 증분
			);
		}

		// 개인 선호 점수 조회
		Double prefScore = null;
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
	public void addBookmark(Long restaurantId, Long userId) {
		updateBookmark(restaurantId, userId, true);
	}

	@Transactional
	@Override
	public void removeBookmark(Long restaurantId, Long userId) {
		updateBookmark(restaurantId, userId, false);
	}

	/**
	 * 즐겨찾기 상태를 업데이트하는 공통 메서드
	 *
	 * @param restaurantId 식당 ID
	 * @param userId 사용자 ID
	 * @param isSaved 즐겨찾기 추가(true) 또는 해제(false)
	 */
	private void updateBookmark(Long restaurantId, Long userId, boolean isSaved) {
		final Instant now = Instant.now();

		// 레스토랑 존재 검증
		if (!restaurantRepository.existsById(restaurantId)) {
			throw new RestaurantException(RestaurantErrorCode.NOT_FOUND_RESTAURANT);
		}

		// 현재 상태 조회
		var stateKey = new UserRestaurantState.Key(userId, restaurantId);
		var existingState = stateRepository.findById(stateKey).orElse(null);
		boolean currentIsSaved = existingState != null && Boolean.TRUE.equals(existingState.getIsSaved());

		// 이미 같은 상태인지 확인 (중복 요청 방지)
		if (currentIsSaved == isSaved) {
			return;
		}

		// 즐겨찾기 추가/해제에 따른 선호 점수 증분
		BigDecimal prefDelta;
		if (isSaved) {
			prefDelta = new BigDecimal("0.500");
		} else {
			prefDelta = currentIsSaved ? new BigDecimal("-0.3") : BigDecimal.ZERO;
		}

		// 신규 생성 시 초기값은 증분과 동일하게 부여
		BigDecimal prefInit = prefDelta;

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
		if (prefDelta.compareTo(BigDecimal.ZERO) != 0) {
			var tagRows = restaurantTagRepository.findByRestaurantId(restaurantId);
			BigDecimal tagDeltaScore;
			BigDecimal tagDeltaConf;
			if (isSaved) {
				tagDeltaScore = new BigDecimal("0.10");
				tagDeltaConf = new BigDecimal("0.20");
			} else {
				tagDeltaScore = new BigDecimal("-0.10");
				tagDeltaConf = new BigDecimal("0.10");
			}

			for (var rt : tagRows) {
				// 신규 생성 시 초기값은 증분과 동일하게 부여 (INSERT 시 initScore/initConf 사용)
				// 업데이트 시에는 deltaScore/deltaConf를 더함
				userTagPrefRepository.upsertIncrement(
					userId,
					rt.getTagId(),
					tagDeltaScore,  // initScore: 신규 생성 시 초기값
					tagDeltaConf,   // initConf: 신규 생성 시 초기값
					tagDeltaScore,  // deltaScore: 업데이트 시 증분
					tagDeltaConf    // deltaConf: 업데이트 시 증분
				);
			}
		}
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	@Override
	public void handleView(Long restaurantId, Long userId) {
		if (userId == null) {
			return;
		}

		if (!restaurantRepository.existsById(restaurantId)) {
			throw new RestaurantException(RestaurantErrorCode.NOT_FOUND_RESTAURANT);
		}

		var stateKey = new UserRestaurantState.Key(userId, restaurantId);
		var existingState = stateRepository.findById(stateKey).orElse(null);

		int currentViewCount = existingState != null ? existingState.getViewCount() : 0;
		BigDecimal prefDelta;

		if (currentViewCount == 0) {
			prefDelta = new BigDecimal("0.10");
		} else if (currentViewCount >= 1 && currentViewCount <= 2) {
			prefDelta = new BigDecimal("0.03");
		} else {
			prefDelta = BigDecimal.ZERO;
		}

		int affectedRows = stateRepository.upsertView(userId, restaurantId, prefDelta);
		if (affectedRows == 0) {
			log.warn("upsertView failed: userId={}, restaurantId={}, prefDelta={}", userId, restaurantId, prefDelta);
		}

		if (prefDelta.compareTo(BigDecimal.ZERO) > 0) {
			var tagRows = restaurantTagRepository.findByRestaurantId(restaurantId);
			BigDecimal tagDeltaScore = prefDelta.multiply(new BigDecimal("0.5"));
			BigDecimal tagDeltaConf = prefDelta.multiply(new BigDecimal("0.3"));

			for (var rt : tagRows) {
				// 신규 생성 시 초기값은 증분과 동일하게 부여 (INSERT 시 initScore/initConf 사용)
				// 업데이트 시에는 deltaScore/deltaConf를 더함
				userTagPrefRepository.upsertIncrement(
					userId,
					rt.getTagId(),
					tagDeltaScore,  // initScore: 신규 생성 시 초기값
					tagDeltaConf,   // initConf: 신규 생성 시 초기값
					tagDeltaScore,  // deltaScore: 업데이트 시 증분
					tagDeltaConf    // deltaConf: 업데이트 시 증분
				);
			}
		}
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	@Override
	public void handleShare(Long restaurantId, Long userId) {
		if (userId == null) {
			return;
		}

		if (!restaurantRepository.existsById(restaurantId)) {
			throw new RestaurantException(RestaurantErrorCode.NOT_FOUND_RESTAURANT);
		}

		var stateKey = new UserRestaurantState.Key(userId, restaurantId);
		var existingState = stateRepository.findById(stateKey).orElse(null);

		int currentShareCount = existingState != null ? existingState.getShareCount() : 0;
		BigDecimal prefDelta;

		if (currentShareCount == 0) {
			prefDelta = new BigDecimal("0.3");
		} else if (currentShareCount >= 1 && currentShareCount <= 2) {
			prefDelta = new BigDecimal("0.1");
		} else {
			prefDelta = BigDecimal.ZERO;
		}

		int affectedRows = stateRepository.upsertShare(userId, restaurantId, prefDelta);
		if (affectedRows == 0) {
			log.warn("upsertShare failed: userId={}, restaurantId={}, prefDelta={}", userId, restaurantId, prefDelta);
		}

		if (prefDelta.compareTo(BigDecimal.ZERO) > 0) {
			var tagRows = restaurantTagRepository.findByRestaurantId(restaurantId);
			BigDecimal tagDeltaScore = prefDelta.multiply(new BigDecimal("0.8"));
			BigDecimal tagDeltaConf = prefDelta.multiply(new BigDecimal("0.6"));

			for (var rt : tagRows) {
				// 신규 생성 시 초기값은 증분과 동일하게 부여 (INSERT 시 initScore/initConf 사용)
				// 업데이트 시에는 deltaScore/deltaConf를 더함
				userTagPrefRepository.upsertIncrement(
					userId,
					rt.getTagId(),
					tagDeltaScore,  // initScore: 신규 생성 시 초기값
					tagDeltaConf,   // initConf: 신규 생성 시 초기값
					tagDeltaScore,  // deltaScore: 업데이트 시 증분
					tagDeltaConf    // deltaConf: 업데이트 시 증분
				);
			}
		}
	}

	@Transactional
	@Override
	public VisitFeedbackResponse handleVisitFeedback(
		Long restaurantId,
		Long userId,
		Boolean isVisited,
		String satisfaction
	) {
		final Instant now = Instant.now();

		if (!restaurantRepository.existsById(restaurantId)) {
			throw new MainException(MainErrorCode.NOT_FOUND_RESTAURANT);
		}

		if (Boolean.FALSE.equals(isVisited)) {
			stateRepository.upsertVisitFeedback(
				userId,
				restaurantId,
				false,
				BigDecimal.ZERO,
				null
			);

			var stateKey = new UserRestaurantState.Key(userId, restaurantId);
			var state = stateRepository.findById(stateKey).orElse(null);
			BigDecimal prefScore = state != null ? state.getPrefScore() : BigDecimal.ZERO;

			return VisitFeedbackResponse.builder()
				.userId(userId)
				.restaurantId(restaurantId)
				.isVisited(false)
				.prefScore(prefScore)
				.build();
		}

		BigDecimal prefDelta;
		Instant cooldownUntil = null;
		BigDecimal tagDeltaScore;
		BigDecimal tagDeltaConf;

		if ("LIKE".equals(satisfaction)) {
			prefDelta = new BigDecimal("1.0");
			tagDeltaScore = new BigDecimal("0.20");
			tagDeltaConf = new BigDecimal("0.20");
		} else if ("NEUTRAL".equals(satisfaction)) {
			prefDelta = new BigDecimal("0.1");
			tagDeltaScore = new BigDecimal("0.02");
			tagDeltaConf = BigDecimal.ZERO;
		} else if ("DISLIKE".equals(satisfaction)) {
			prefDelta = new BigDecimal("-1.0");
			cooldownUntil = now.plus(Duration.ofDays(30));
			tagDeltaScore = new BigDecimal("-0.20");
			tagDeltaConf = new BigDecimal("0.20");
		} else {
			prefDelta = new BigDecimal("0.1");
			tagDeltaScore = new BigDecimal("0.02");
			tagDeltaConf = BigDecimal.ZERO;
		}

		stateRepository.upsertVisitFeedback(
			userId,
			restaurantId,
			true,
			prefDelta,
			cooldownUntil
		);

		if (tagDeltaScore.compareTo(BigDecimal.ZERO) != 0
			|| tagDeltaConf.compareTo(BigDecimal.ZERO) != 0) {
			var tagRows = restaurantTagRepository.findByRestaurantId(restaurantId);
			for (var rt : tagRows) {
				// 신규 생성 시 초기값은 증분과 동일하게 부여 (INSERT 시 initScore/initConf 사용)
				// 업데이트 시에는 deltaScore/deltaConf를 더함
				userTagPrefRepository.upsertIncrement(
					userId,
					rt.getTagId(),
					tagDeltaScore,  // initScore: 신규 생성 시 초기값
					tagDeltaConf,   // initConf: 신규 생성 시 초기값
					tagDeltaScore,  // deltaScore: 업데이트 시 증분
					tagDeltaConf    // deltaConf: 업데이트 시 증분
				);
			}
		}

		var stateKey = new UserRestaurantState.Key(userId, restaurantId);
		var state = stateRepository.findById(stateKey).orElse(null);
		BigDecimal prefScore = state != null ? state.getPrefScore() : prefDelta;

		return VisitFeedbackResponse.builder()
			.userId(userId)
			.restaurantId(restaurantId)
			.isVisited(true)
			.prefScore(prefScore)
			.build();
	}
}

