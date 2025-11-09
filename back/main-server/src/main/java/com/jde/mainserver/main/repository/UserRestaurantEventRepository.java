/**
 * main/repository/UserRestaurantEventRepository.java
 * 사용자 식당 액션 이벤트 로그 Repository
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.main.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jde.mainserver.main.entity.UserRestaurantEvent;

@Repository
public interface UserRestaurantEventRepository extends JpaRepository<UserRestaurantEvent, Long> {

}
