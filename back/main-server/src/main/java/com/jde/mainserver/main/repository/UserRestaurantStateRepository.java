/**
 * main/repository/UserRestaurantStateRepository.java
 * 사용자 식당 상태 Repository
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.main.repository;

import com.jde.mainserver.main.entity.UserRestaurantState;
import com.jde.mainserver.main.entity.UserRestaurantState.Key;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Repository
public interface UserRestaurantStateRepository extends JpaRepository<UserRestaurantState, Key> {

	/**
	 * 상태 기본 필드 upsert (PostgreSQL ON CONFLICT)
	 *
	 * 스와이프 액션(SELECT/DISLIKE/HOLD) 반영용으로 최소 컬럼만 갱신
	 * - 동시성 안전: ON CONFLICT로 race condition 방지
	 * - 선호 점수 범위 제한: -10.000 ~ +10.000
	 * - 신규 생성 시: view_count=0, share_count=0, pref_score=prefInit
	 * - 업데이트 시: pref_score += prefDelta (범위 내에서)
	 * - DISLIKE 시: cooldownUntil 설정 (null이면 설정하지 않음)
	 *
	 * @param userId 사용자 ID
	 * @param restaurantId 식당 ID
	 * @param isSaved 저장 여부
	 * @param lastSwipe 최근 스와이프 액션 (HOLD/DISLIKE/SELECT)
	 * @param lastSwipeAt 최근 스와이프 시각
	 * @param prefInit 신규 생성 시 초기 선호 점수
	 * @param prefDelta 업데이트 시 선호 점수 증분
	 * @param updateSaved is_saved 필드 업데이트 여부
	 * @param cooldownUntil 쿨다운 종료 시각 (DISLIKE 시 설정, null 가능)
	 * @return 영향받은 행 수 (1 또는 0)
	 */
	@Modifying
	@Query(value = """
		INSERT INTO user_restaurant_state (
			user_id, restaurant_id, is_saved, last_swipe, last_swipe_at,
			cooldown_until, view_count, share_count, pref_score, created_at, updated_at
		) VALUES (
			:userId, :restaurantId, :isSaved, :lastSwipe, :lastSwipeAt,
			:cooldownUntil, 0, 0, :prefInit, now(), now()
		)
		ON CONFLICT (user_id, restaurant_id) DO UPDATE SET
			is_saved = CASE WHEN :updateSaved THEN EXCLUDED.is_saved ELSE user_restaurant_state.is_saved END,
			last_swipe = EXCLUDED.last_swipe,
			last_swipe_at = EXCLUDED.last_swipe_at,
			cooldown_until = COALESCE(:cooldownUntil, user_restaurant_state.cooldown_until),
			pref_score = GREATEST(LEAST(user_restaurant_state.pref_score + :prefDelta, 10.000), -10.000),
			updated_at = now()
		""", nativeQuery = true)
	int upsertBasic(
		@Param("userId") Long userId,
		@Param("restaurantId") Long restaurantId,
		@Param("isSaved") boolean isSaved,
		@Param("lastSwipe") String lastSwipe,
		@Param("lastSwipeAt") Instant lastSwipeAt,
		@Param("prefInit") BigDecimal prefInit,
		@Param("prefDelta") BigDecimal prefDelta,
		@Param("updateSaved") boolean updateSaved,
		@Param("cooldownUntil") Instant cooldownUntil
	);

	/**
	 * 특정 사용자의 여러 식당 상태 벌크 조회
	 *
	 * 후보 식당 필터링 및 개인 선호 점수 조회에 사용
	 *
	 * @param userId 사용자 ID
	 * @param restaurantIds 식당 ID 리스트
	 * @return 해당 사용자의 식당 상태 리스트
	 */
	List<UserRestaurantState> findById_UserIdAndId_RestaurantIdIn(
		Long userId,
		Collection<Long> restaurantIds
	);

	/**
	 * 상세 조회 처리 (view_count 증가 및 선호 점수 업데이트)
	 *
	 * - 첫 상세 조회: +0.10
	 * - 2~3회 재조회: 회당 +0.03씩 추가
	 * - 최대 가산 한도: +0.20
	 *
	 * @param userId 사용자 ID
	 * @param restaurantId 식당 ID
	 * @param prefDelta 선호 점수 증분
	 * @return 영향받은 행 수
	 */
	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query(value = """
		INSERT INTO user_restaurant_state (
			user_id, restaurant_id, is_saved, view_count, share_count, pref_score, created_at, updated_at
		) VALUES (
			:userId, :restaurantId, false, 1, 0, :prefDelta, now(), now()
		)
		ON CONFLICT (user_id, restaurant_id) DO UPDATE SET
			view_count = user_restaurant_state.view_count + 1,
			pref_score = GREATEST(LEAST(user_restaurant_state.pref_score + :prefDelta, 10.000), -10.000),
			updated_at = now()
		""", nativeQuery = true)
	int upsertView(
		@Param("userId") Long userId,
		@Param("restaurantId") Long restaurantId,
		@Param("prefDelta") BigDecimal prefDelta
	);

	/**
	 * 공유 처리 (share_count 증가 및 선호 점수 업데이트)
	 *
	 * - 첫 공유: +0.6
	 * - 추가 공유: 회당 +0.1
	 * - 최대 가산 한도: +0.8
	 *
	 * @param userId 사용자 ID
	 * @param restaurantId 식당 ID
	 * @param prefDelta 선호 점수 증분
	 * @return 영향받은 행 수
	 */
	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query(value = """
		INSERT INTO user_restaurant_state (
			user_id, restaurant_id, is_saved, view_count, share_count, pref_score, created_at, updated_at
		) VALUES (
			:userId, :restaurantId, false, 0, 1, :prefDelta, now(), now()
		)
		ON CONFLICT (user_id, restaurant_id) DO UPDATE SET
			share_count = user_restaurant_state.share_count + 1,
			pref_score = GREATEST(LEAST(user_restaurant_state.pref_score + :prefDelta, 10.000), -10.000),
			updated_at = now()
		""", nativeQuery = true)
	int upsertShare(
		@Param("userId") Long userId,
		@Param("restaurantId") Long restaurantId,
		@Param("prefDelta") BigDecimal prefDelta
	);

	/**
	 * 방문 피드백 처리 (is_visited 업데이트 및 선호 점수 조정)
	 *
	 * - 방문 안 함: is_visited = false, 점수 변화 없음
	 * - 방문 + 좋았어요: pref_score += 1.0, 태그 score += 0.20, confidence += 0.20
	 * - 방문 + 그냥 그랬어요: pref_score += 0.1, 태그 score += 0.02
	 * - 방문 + 별로였어요: pref_score += -1.0, cooldown_until = now + 30일, 태그 score -= 0.20, confidence += 0.20
	 *
	 * @param userId 사용자 ID
	 * @param restaurantId 식당 ID
	 * @param isVisited 방문 여부
	 * @param prefDelta 선호 점수 증분
	 * @param cooldownUntil 쿨다운 종료 시각 (별로였어요일 경우 30일 후)
	 * @return 영향받은 행 수
	 */
	@Modifying
	@Query(value = """
		INSERT INTO user_restaurant_state (
			user_id, restaurant_id, is_saved, view_count, share_count, pref_score, is_visited, created_at, updated_at
		) VALUES (
			:userId, :restaurantId, false, 0, 0, :prefDelta, :isVisited, now(), now()
		)
		ON CONFLICT (user_id, restaurant_id) DO UPDATE SET
			is_visited = :isVisited,
			pref_score = GREATEST(LEAST(user_restaurant_state.pref_score + :prefDelta, 10.000), -10.000),
			cooldown_until = COALESCE(:cooldownUntil, user_restaurant_state.cooldown_until),
			updated_at = now()
		""", nativeQuery = true)
	int upsertVisitFeedback(
		@Param("userId") Long userId,
		@Param("restaurantId") Long restaurantId,
		@Param("isVisited") Boolean isVisited,
		@Param("prefDelta") BigDecimal prefDelta,
		@Param("cooldownUntil") Instant cooldownUntil
	);

	/**
	 * 최근 SELECT 액션으로 선택한 식당 조회
	 *
	 * @param userId 사용자 ID
	 * @return 최근 선택한 식당 상태 (없으면 null)
	 */
	@Query("""
		SELECT urs FROM UserRestaurantState urs
		WHERE urs.id.userId = :userId
		AND urs.lastSwipe = :swipeAction
		ORDER BY urs.lastSwipeAt DESC
		""")
	java.util.Optional<UserRestaurantState> findLastSelectedByUserId(
		@Param("userId") Long userId,
		@Param("swipeAction") com.jde.mainserver.main.entity.enums.SwipeAction swipeAction
	);

	default java.util.Optional<UserRestaurantState> findLastSelectedByUserId(Long userId) {
		return findLastSelectedByUserId(userId, com.jde.mainserver.main.entity.enums.SwipeAction.SELECT);
	}

	/**
	 * 사용자가 pref_score를 가진 식당이 있는지 확인
	 *
	 * @param userId 사용자 ID
	 * @return pref_score가 있는 식당이 하나라도 있으면 true
	 */
	@Query("""
		SELECT COUNT(urs)
		FROM UserRestaurantState urs
		WHERE urs.id.userId = :userId
		AND urs.prefScore <> 0
		""")
	long countByUserIdAndPrefScoreNotZero(@Param("userId") Long userId);

	default boolean existsByUserIdAndPrefScoreNotZero(Long userId) {
		return countByUserIdAndPrefScoreNotZero(userId) > 0;
	}

	/**
	 * 사용자가 즐겨찾기한 식당 ID 리스트 조회
	 *
	 * @param userId 사용자 ID
	 * @return is_saved=true인 식당 ID 리스트
	 */
	@Query("""
		SELECT urs.id.restaurantId FROM UserRestaurantState urs
		WHERE urs.id.userId = :userId
		AND urs.isSaved = true
		""")
	List<Long> findSavedRestaurantIdsByUserId(@Param("userId") Long userId);
}
