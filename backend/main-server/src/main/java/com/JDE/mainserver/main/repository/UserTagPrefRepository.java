/**
 * main/repository/UserTagPrefRepository.java
 * user_tag_pref 조회 레포지토리
 * Author: Jang
 * Date: 2025-11-04
 */
package com.JDE.mainserver.main.repository;

import com.JDE.mainserver.main.entity.UserTagPref;
import com.JDE.mainserver.main.service.query.UserTagPrefProvider;
import com.JDE.mainserver.main.service.query.UserTagPrefProvider.TagStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
public interface UserTagPrefRepository extends JpaRepository<UserTagPref, UserTagPref.PK>, UserTagPrefProvider {

    /** 단일 사용자의 태그 선호도 조회 */
    List<UserTagPref> findByUserId(Long userId);

    /** UserTagPrefProvider 구현: Entity → TagStat 변환 */
    @Override
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
}

