/**
 * main/entity/UserRestaurantEvent
 * 식당 액션 이벤트 로그
 * Author: Jang
 * Date: 2025-11-06
 */

package com.jde.mainserver.main.entity;

import com.jde.mainserver.global.common.BaseEntity;
import com.jde.mainserver.main.entity.enums.SwipeAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_restaurant_event",
	indexes = {
		@Index(name = "idx_ure_user_created_desc", columnList = "user_id, created_at"),
		@Index(name = "idx_ure_user_rest_created_desc", columnList = "user_id, restaurant_id, created_at"),
	})
public class UserRestaurantEvent extends BaseEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "event_id")
	private Long eventId;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "restaurant_id", nullable = false)
	private Long restaurantId;

	@Enumerated(EnumType.STRING)
	@Column(name = "event_type", nullable = false, length = 16)
	private SwipeAction eventType;  // HOLD / DISLIKE / SELECT
}
