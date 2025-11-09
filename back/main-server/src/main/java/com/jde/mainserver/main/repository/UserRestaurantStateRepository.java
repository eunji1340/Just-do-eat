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

	// ==================== TODO: 향후 구현 예정 ====================

	/**
	 * 상세보기 횟수 증가
	 *
	 * 프론트엔드에서 상세보기 버튼 클릭 시 호출
	 *
	 * @param userId 사용자 ID
	 * @param restaurantId 식당 ID
	 * @return 영향받은 행 수
	 */
	// TODO: 구현 예정
	// @Modifying
	// @Query(value = """
	// 	UPDATE user_restaurant_state
	// 	SET view_count = view_count + 1, updated_at = now()
	// 	WHERE user_id = :userId AND restaurant_id = :restaurantId
	// 	""", nativeQuery = true)
	// int incrementViewCount(@Param("userId") Long userId, @Param("restaurantId") Long restaurantId);

	/**
	 * 공유 횟수 증가
	 *
	 * 프론트엔드에서 공유 버튼 클릭 시 호출
	 *
	 * @param userId 사용자 ID
	 * @param restaurantId 식당 ID
	 * @return 영향받은 행 수
	 */
	// TODO: 구현 예정
	// @Modifying
	// @Query(value = """
	// 	UPDATE user_restaurant_state
	// 	SET share_count = share_count + 1, updated_at = now()
	// 	WHERE user_id = :userId AND restaurant_id = :restaurantId
	// 	""", nativeQuery = true)
	// int incrementShareCount(@Param("userId") Long userId, @Param("restaurantId") Long restaurantId);
}
