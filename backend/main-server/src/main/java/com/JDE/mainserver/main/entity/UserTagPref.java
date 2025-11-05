/**
 * main/entity/UserTagPref.java
 * 유저 태그 선호 엔티티
 * Author: Jang
 * Date: 2025-11-03
 *
 */

package com.JDE.mainserver.main.entity;

import com.JDE.mainserver.global.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(
	name = "user_tag_pref",
	indexes = {
		// 유저 개인 피드에서 user_id 조건 조회가 많으므로 인덱스 권장
		@Index(name = "idx_user_tag_pref__user_id", columnList = "user_id"),
	}
)
@IdClass(UserTagPref.PK.class)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserTagPref extends BaseEntity {

	/** 유저 ID (복합 PK) */
	@Id
	@Column(name = "user_id", nullable = false)
	private Long userId;

	/** 태그 ID (복합 PK) */
	@Id
	@Column(name = "tag_id", nullable = false)
	private Long tagId;

	/** 선호 점수 (-3.00 ~ 3.00) */
	@Digits(integer = 2, fraction = 2)
	@DecimalMin(value = "-3.00")                 // 비즈니스 범위 고정
	@DecimalMax(value = "3.00")
	@Column(precision = 4, scale = 2, nullable = false)
	private BigDecimal score;

	/** 신뢰도 (0.00 ~ 1.00) */
	@Digits(integer = 1, fraction = 2)
	@DecimalMin(value = "0.00")
	@DecimalMax(value = "1.00")
	@Column(precision = 3, scale = 2, nullable = false)
	private BigDecimal confidence;

	/** 복합키 클래스 */
	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class PK implements Serializable {
		private Long userId;
		private Long tagId;
		private static final long serialVersionUID = 1L;
	}
}
