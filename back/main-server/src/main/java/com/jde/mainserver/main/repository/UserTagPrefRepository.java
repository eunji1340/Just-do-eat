/**
 * main/repository/UserTagPrefRepository.java
 * 사용자 태그 선호도 Repository
 * Author: Jang
 * Date: 2025-11-04
 */

package com.jde.mainserver.main.repository;

import com.jde.mainserver.main.entity.UserTagPref;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
public interface UserTagPrefRepository extends JpaRepository<UserTagPref, UserTagPref.PK> {

	/**
	 * 태그 선호도 증분 upsert (PostgreSQL ON CONFLICT)
	 *
	 * 스와이프 액션에 따라 태그 선호도를 업데이트
	 * - 동시성 안전: ON CONFLICT로 race condition 방지
	 * - 선호 점수 범위 제한: -3.00 ~ +3.00
	 * - 신뢰도 범위 제한: 0.00 ~ 1.00
	 * - 신규 생성 시: score=initScore, confidence=initConf
	 * - 업데이트 시: score += deltaScore, confidence += deltaConf (범위 내에서)
	 *
	 * @param userId 사용자 ID
	 * @param tagId 태그 ID
	 * @param initScore 신규 생성 시 초기 선호 점수
	 * @param initConf 신규 생성 시 초기 신뢰도
	 * @param deltaScore 업데이트 시 선호 점수 증분
	 * @param deltaConf 업데이트 시 신뢰도 증분
	 * @return 영향받은 행 수 (1 또는 0)
	 */
	@Modifying
	@Query(value = """
		INSERT INTO user_tag_pref (user_id, tag_id, score, confidence, created_at, updated_at)
		VALUES (:userId, :tagId, :initScore, :initConf, now(), now())
		ON CONFLICT (user_id, tag_id) DO UPDATE SET
			score = GREATEST(LEAST(user_tag_pref.score + :deltaScore, 3.00), -3.00),
			confidence = LEAST(user_tag_pref.confidence + :deltaConf, 1.00),
			updated_at = now()
		""", nativeQuery = true)
	int upsertIncrement(
		@Param("userId") Long userId,
		@Param("tagId") Long tagId,
		@Param("initScore") BigDecimal initScore,
		@Param("initConf") BigDecimal initConf,
		@Param("deltaScore") BigDecimal deltaScore,
		@Param("deltaConf") BigDecimal deltaConf
	);

	/**
	 * 단일 사용자의 모든 태그 선호도 조회
	 *
	 * 개인화 피드 점수 계산 시 사용자 태그 선호도 맵 구성에 사용
	 *
	 * @param userId 사용자 ID
	 * @return 해당 사용자의 태그 선호도 리스트
	 */
	List<UserTagPref> findByUserId(Long userId);

	/**
	 * 사용자 태그 선호도를 TagStat 맵으로 변환
	 *
	 * Entity 리스트를 tagId → TagStat 맵으로 변환하여
	 * 개인화 점수 계산 시 빠른 조회 가능하도록 제공
	 *
	 * @param userId 사용자 ID
	 * @return tagId를 키로 하는 TagStat 맵
	 */
	default Map<Long, TagStat> getUserTagStats(Long userId) {
		return findByUserId(userId).stream()
			.collect(Collectors.toMap(
				UserTagPref::getTagId,
				pref -> new TagStat(
					pref.getScore().doubleValue(),
					pref.getConfidence().doubleValue()
				)
			));
	}

	/**
	 * 태그 점수 및 신뢰도 통계
	 *
	 * @param score 선호 점수 (-3.00 ~ +3.00)
	 * @param confidence 신뢰도 (0.0 ~ 1.0)
	 */
	record TagStat(double score, double confidence) {
	}
}