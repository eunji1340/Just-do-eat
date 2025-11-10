/**
 * main/service/command/MainCommandService.java
 * 메인 Command 서비스 인터페이스
 * Author: Jang
 * Date: 2025-11-04
 */

package com.jde.mainserver.main.service.command;

import com.jde.mainserver.main.web.dto.request.SwipeRequest;
import com.jde.mainserver.main.web.dto.response.SwipeResponse;
import com.jde.mainserver.restaurants.web.dto.response.BookmarkResponse;

public interface MainCommandService {
	/**
	 * 스와이프 액션을 처리합니다.
	 *
	 * 이벤트 저장, 상태 업데이트, 태그 선호도 업데이트를 수행합니다.
	 *
	 * @param userId 사용자 ID
	 * @param request 스와이프 액션 요청 DTO (restaurantId, action)
	 * @return 처리 결과 및 최신 상태 스냅샷을 담은 응답 DTO
	 * @throws com.jde.mainserver.main.exception.MainException 식당을 찾을 수 없는 경우
	 */
	SwipeResponse handleSwipe(Long userId, SwipeRequest request);

	/**
	 * 즐겨찾기를 추가합니다.
	 *
	 * is_saved=true로 변경되며 개인 선호 점수와 태그 선호도가 업데이트됩니다.
	 *
	 * @param restaurantId 식당 ID
	 * @param userId 사용자 ID
	 * @return 처리 결과 및 최신 상태 스냅샷을 담은 응답 DTO
	 * @throws com.jde.mainserver.main.exception.MainException 식당을 찾을 수 없는 경우
	 */
	BookmarkResponse addBookmark(Long restaurantId, Long userId);

	/**
	 * 즐겨찾기를 해제합니다.
	 *
	 * is_saved=false로 변경되며 개인 선호 점수와 태그 선호도가 업데이트됩니다.
	 *
	 * @param restaurantId 식당 ID
	 * @param userId 사용자 ID
	 * @return 처리 결과 및 최신 상태 스냅샷을 담은 응답 DTO
	 * @throws com.jde.mainserver.main.exception.MainException 식당을 찾을 수 없는 경우
	 */
	BookmarkResponse removeBookmark(Long restaurantId, Long userId);

	/**
	 * 식당 상세 조회를 처리합니다.
	 *
	 * view_count를 증가시키고 선호 점수를 업데이트합니다.
	 * - 첫 상세 조회: +0.10
	 * - 2~3회 재조회: 회당 +0.03씩 추가
	 * - 최대 가산 한도: +0.20
	 *
	 * @param restaurantId 식당 ID
	 * @param userId 사용자 ID
	 */
	void handleView(Long restaurantId, Long userId);

	/**
	 * 식당 공유를 처리합니다.
	 *
	 * share_count를 증가시키고 선호 점수를 업데이트합니다.
	 * - 첫 공유: +0.6
	 * - 추가 공유: 회당 +0.1
	 * - 최대 가산 한도: +0.8
	 *
	 * @param restaurantId 식당 ID
	 * @param userId 사용자 ID
	 */
	void handleShare(Long restaurantId, Long userId);

	/**
	 * 방문 피드백을 처리합니다.
	 *
	 * 방문 여부와 만족도에 따라 선호 점수와 태그 선호도를 업데이트합니다.
	 * - 방문 안 함: is_visited = false, 점수 변화 없음
	 * - 방문 + 좋았어요: pref_score += 1.0, 태그 score += 0.20, confidence += 0.20
	 * - 방문 + 그냥 그랬어요: pref_score += 0.1, 태그 score += 0.02
	 * - 방문 + 별로였어요: pref_score += -1.0, cooldown_until = now + 30일, 태그 score -= 0.20, confidence += 0.20
	 *
	 * @param restaurantId 식당 ID
	 * @param userId 사용자 ID
	 * @param isVisited 방문 여부
	 * @param satisfaction 만족도 ("LIKE" | "NEUTRAL" | "DISLIKE" | null)
	 * @return 처리 결과 및 최신 상태 스냅샷을 담은 응답 DTO
	 * @throws com.jde.mainserver.main.exception.MainException 식당을 찾을 수 없는 경우
	 */
	com.jde.mainserver.main.web.dto.response.VisitFeedbackResponse handleVisitFeedback(
		Long restaurantId,
		Long userId,
		Boolean isVisited,
		String satisfaction
	);
}

