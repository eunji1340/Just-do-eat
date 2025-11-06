package com.jde.mainserver.restaurants.repository;

/**
 * restaurants/repository/RestaurantTagRepository.java
 * 식당-태그 매핑 레포지토리
 * Author: Jang
 * Date: 2025-11-04
 *
 */

import com.jde.mainserver.restaurants.entity.RestaurantTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

@Repository
public interface RestaurantTagRepository extends JpaRepository<RestaurantTag, RestaurantTag.PK> {

    /** 단일 식당의 태그들 */
    List<RestaurantTag> findByRestaurantId(Long restaurantId);

    /** 다건 식당의 태그들 */
    List<RestaurantTag> findByRestaurantIdIn(Collection<Long> restaurantIds);

    /** 특정 태그를 가진 식당들 조회 (주류 판매 여부 확인용) */
    List<RestaurantTag> findByTagId(Long tagId);

    /** 프로젝션 DTO interface: 필요한 컬럼만 조회 */
    interface TagRow {
        Long getRestaurantId();
        Long getTagId();
        BigDecimal getWeight();
        BigDecimal getConfidence();
    }

}
