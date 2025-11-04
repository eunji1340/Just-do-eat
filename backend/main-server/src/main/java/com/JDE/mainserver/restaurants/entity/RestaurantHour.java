/**
 * restaurants/entity/RestaurantHour.java
 * 식당 영업시간 엔티티
 * Author: Jang
 * Date: 2025-11-03
 */

package com.JDE.mainserver.restaurants.entity;

import com.JDE.mainserver.global.common.BaseEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "restaurant_hour")
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class RestaurantHour extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "hour_id")
	private Long id;

	/** 식당 엔티티 참조 (N:1)
	 *  - 하나의 식당은 여러 영업시간 레코드를 가질 수 있음
	 *  - 지연로딩(LAZY): 필요할 때만 join
	 */
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "restaurant_id")
	private Restaurant restaurant;

	/** 요일 (Day of Week)
	 *  - 1=월요일, 7=일요일
	 *  - 주간 단위 영업패턴 관리용
	 */
	private Integer dow;

	/** 영업 시작 시각 (HH:mm) */
	@Column(name = "open")
	private LocalTime open;

	/** 영업 종료 시각 (HH:mm) */
	@Column(name = "close")
	private LocalTime close;

	/** 브레이크타임 시작 시각 (nullable) */
	@Column(name = "break_open")
	private LocalTime breakOpen;

	/** 브레이크타임 종료 시각 (nullable) */
	@Column(name = "break_close")
	private LocalTime breakClose;

	/** 휴무 여부
	 *  - true면 해당 요일은 영업하지 않음
	 */
	@Column(name = "is_holiday")
	private Boolean isHoliday;
}
