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
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.restaurants.repository.RestaurantTagRepository;

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
	public SwipeResponse handleSwipe(SwipeRequest request) {
		final Long userId = request.getUserId();
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
}

