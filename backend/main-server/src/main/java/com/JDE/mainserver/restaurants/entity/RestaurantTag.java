/**
 * restaurants/entity/RestaurantTag.java
 * 식당 태그 엔티티 (식당-태그 가중치/신뢰도)
 * Author: Jang
 * Date: 2025-11-03
 */

package com.JDE.mainserver.restaurants.entity;

import com.JDE.mainserver.global.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(name = "restaurant_tag")
@IdClass(RestaurantTag.PK.class)  // 복합키 방식: PK 클래스로 (restaurant_id, tag_id) 지정
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RestaurantTag extends BaseEntity {

	@Id
	@Column(name = "restaurant_id", nullable = false)
	private Long restaurantId;

	@Id
	@Column(name = "tag_id", nullable = false)
	private Long tagId;

	/** 태그 가중치 (-3.00 ~ +3.00) */
	@Digits(integer = 2, fraction = 2)
	@DecimalMin(value = "-3.00")
	@DecimalMax(value = "3.00")
	@Column(precision = 3, scale = 2, nullable = false)
	private BigDecimal weight;

	/** 추론 신뢰도 (0.00 ~ 1.00)
	 *  - 모델/수집 방식에 따른 확신 정도 표현
	 */
	@Digits(integer = 1, fraction = 2)
	@DecimalMin(value = "0.00")
	@DecimalMax(value = "1.00")
	@Column(precision = 3, scale = 2, nullable = false)
	private BigDecimal confidence;   // 0.00~1.00 등

	/** 복합키 클래스 */
	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class PK implements Serializable {
		private Long restaurantId;
		private Long tagId;
	}
}