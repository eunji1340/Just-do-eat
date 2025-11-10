/**
 * feed/entity/UserRestaurantState.java
 * 유저 식당 상태 스냅샷
 * Author: Jang
 * Date: 2025-11-06
 */

package com.jde.mainserver.main.entity;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

import com.jde.mainserver.global.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_restaurant_state",
	indexes = {
		@Index(name = "idx_urs_user", columnList = "user_id"),
		@Index(name = "idx_urs_user_saved", columnList = "user_id, is_saved")
	})
public class UserRestaurantState extends BaseEntity{

	@Getter @Setter
	@NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
	@Embeddable
	public static class Key implements Serializable {
		@Column(name = "user_id", nullable = false)
		private Long userId;

		@Column(name = "restaurant_id", nullable = false)
		private Long restaurantId;
	}

	@EmbeddedId
	private Key id;

	@Column(name = "is_saved", nullable = false)
	private Boolean isSaved;

	@Enumerated(EnumType.STRING)
	@Column(name = "last_swipe", length = 16)
	private SwipeAction lastSwipe;

	@Column(name = "last_swipe_at")
	private Instant lastSwipeAt;

	@Column(name = "cooldown_until")
	private Instant cooldownUntil;

	@Column(name = "view_count", nullable = false)
	private int viewCount;

	@Column(name = "share_count", nullable = false)
	private int shareCount;

	@Column(name = "pref_score", precision = 6, scale = 3, nullable = false)
	private BigDecimal prefScore;

	@Column(name = "is_visited")
	private Boolean isVisited;  // null = 미응답, true = 방문함, false = 방문 안 함

	@PrePersist
	private void prePersist() {
		if (isSaved == null) isSaved = false;                  // null 방지
		if (prefScore == null) prefScore = new BigDecimal("0.000");
		if (viewCount < 0) viewCount = 0;
		if (shareCount < 0) shareCount = 0;
	}
}
