/**
 * restaurants/entity/Restaurant.java
 * 식당 엔티티
 * Author: Jang
 * Date: 2025-11-03
 */

package com.jde.mainserver.restaurants.entity;

import com.jde.mainserver.global.common.BaseEntity;
import com.jde.mainserver.restaurants.entity.enums.OpenStatus;
import com.jde.mainserver.restaurants.entity.enums.PriceRange;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "restaurant")
@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class Restaurant extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "restaurant_id")
	private Long id;

	/** 카카오 장소 Id */
	@Column(name = "kakao_id", unique = true)
	private Long kakaoId;

	/** 이름 */
	@Column(length = 200, nullable = false)
	private String name;

	/** 도로명주소 */
	@Column(length = 255)
	private String address;

	/** 지번주소 */
	@Column(name = "address_lot", length = 255)
	private String addressLot;

	/** 위치(좌표) - GEOMETRY(Point,4326) : x=경도, y=위도 */
	@Column(name = "geom", columnDefinition = "geometry(Point,4326)")
	private Point geom;

	/** 전화번호 */
	@Column(length = 30)
	private String phone;

	/** 카카오 소개(JSONB) */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "kakao_summary", columnDefinition = "jsonb")
	private Map<String, Object> kakaoSummary;

	/** 카테고리 대/중/소 */
	@Column(name = "category1")
	private String category1;

	@Column(name = "category2")
	private String category2;

	@Column(name = "category3")
	private String category3;

	/** 카카오맵 URL (TEXT) */
	@Column(name = "kakao_url", columnDefinition = "text")
	private String kakaoUrl;

	/** 카카오 평점 (DECIMAL(2,1) */
	@Column(name = "kakao_rating", precision = 2, scale = 1)
	private BigDecimal kakaoRating;

	/** 카카오 리뷰 수 / 블로그 리뷰 수 */
	@Column(name = "kakao_review_cnt")
	private Integer kakaoReviewCnt;

	@Column(name = "blog_review_cnt")
	private Integer blogReviewCnt;

	/** 가격대 (LOW, MEDIUM, HIGH, PREMIUM) */
	@Enumerated(EnumType.STRING)
	@Column(name = "price_range", length = 10)
	private PriceRange priceRange;

	/** 사진(JSONB) - 이미지 URL 배열 */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "image", columnDefinition = "jsonb")
	private List<String> image;

	/** 메뉴(JSONB) - MenuItem 배열 */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "menu", columnDefinition = "jsonb")
	private List<MenuItem> menu;

	/** 카카오 방문 트래픽(JSONB) */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "kakao_visits", columnDefinition = "jsonb")
	private Map<String, Object> kakaoVisits;

	/** 주차 가능 여부 / 예약 가능 여부 */
	@Column(name = "is_parking")
	private Boolean isParking;

	@Column(name = "is_reservation")
	private Boolean isReservation;

	@Column(name = "tags", columnDefinition = "TEXT")
	private String tags;

	/** 영업시간(1:N) */
	@OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<RestaurantHour> hours;

	/** 현재 영업 상태 계산 (DB 비저장, Asia/Seoul 기준) */
	@Transient
	public OpenStatus getOpenStatus() {
		return com.jde.mainserver.restaurants.service.OpenStatusUtil
			.calcStatus(this.hours, ZoneId.of("Asia/Seoul"));
	}

	/** 메뉴 항목 */
	@Getter
	@Setter
	@NoArgsConstructor
	public static class MenuItem {
		private String name;
		private Integer price;
		@JsonProperty("is_recommend")
		private Boolean isRecommend;
		@JsonProperty("is_ai_mate")
		private Boolean isAiMate;
	}
}