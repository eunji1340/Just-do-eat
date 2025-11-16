/**
 * restaurants/repository/RestaurantTagRepository.java
 * 식당-태그 매핑 레포지토리
 * Author: Jang
 * Date: 2025-11-04
 *
 */

package com.jde.mainserver.restaurants.repository;

import com.jde.mainserver.restaurants.entity.RestaurantTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface RestaurantTagRepository extends JpaRepository<RestaurantTag, RestaurantTag.PK> {

    /** 단일 식당의 태그들 */
    List<RestaurantTag> findByRestaurantId(Long restaurantId);

    /** 다건 식당의 태그들 */
    List<RestaurantTag> findByRestaurantIdIn(Collection<Long> restaurantIds);

    /** 특정 태그를 가진 식당들의 RestaurantTag 조회 */
    List<RestaurantTag> findByTagId(Long tagId);
}
