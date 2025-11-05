/**
 * restaurants/entity/Restaurant.java
 * 식당 엔티티
 * Author: Jang
 * Date: 2025-11-03
 */

package com.JDE.mainserver.restaurants.entity;

import com.JDE.mainserver.global.common.BaseEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.List;

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

	/** 식당명 */
	private String name;

	/** 주소 문자열 (도로명주소 기준) */
	private String address;

	/** 전화번호 */
	private String phone;

	/** 위치 좌표 (PostGIS geometry(Point,4326))
	 *  - x = longitude, y = latitude
	 *  - 4326 = WGS84 좌표계 (GPS 표준)
	 */
	@Column(name = "geom", columnDefinition = "geometry(Point,4326)")
	private Point geom;

	/** 한 줄 요약 / 소개 */
	private String summary;

	/** 카테고리 (예: 한식, 중식, 일식 등) */
	private String category;

	/** 구글 평점 (예: 4.27) - 소수 2자리 */
	@Column(precision = 3, scale = 2)
	private BigDecimal rating;

	/** 가격대 (LOW, MEDIUM, HIGH, PREMIUM) */
	@Enumerated(EnumType.STRING)
	@Column(name = "price_range")
	private PriceBucket priceRange;

	/** 외부 식당 식별자 (카카오) */
	@Column(name = "kakao_place_id")
	private String kakaoPlaceId;

	/** 외부 식당 식별자 (구글) */
	@Column(name = "google_place_id")
	private String googlePlaceId;

	/** 카카오 맵 링크 */
	@Column(name = "website_url")
	private String websiteUrl;

	/** 이미지 리스트(JSONB) - S3 URL */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private List<String> images;

	/** 메뉴 리스트 (JSONB) - 내부 클래스 MenuItem(name, price) */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private List<MenuItem> menu;

	/** 대기시간/웨이팅 관련 정보 (임시) */
	@Column(name = "waiting")
	private String waiting;

	/** 영업시간 정보 (1:N)
	 *  - RestaurantHour 엔티티에 restaurant(FK)로 매핑
	 *  - 식당 삭제 시 하위 영업시간 자동 삭제
	 */
	@OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<RestaurantHour> hours;

	/** 현재 영업 상태 계산용 (DB 비저장)
	 *  - Transient: 컬럼 매핑 제외
	 *  - 한국시간(Asia/Seoul) 기준으로 계산
	 */
	@Transient
	public OpenStatus getOpenStatus() {
		return com.JDE.mainserver.restaurants.service.OpenStatusUtil
			.calcStatus(this.hours, ZoneId.of("Asia/Seoul"));
	}

	/** 가격대 Enum */
	public enum PriceBucket { LOW, MEDIUM, HIGH, PREMIUM }

	/** 영업 상태 Enum */
	public enum OpenStatus { OPEN, CLOSED, BREAK, UNKNOWN }

	/** 메뉴 항목 내부 클래스 */
	@Getter @Setter @NoArgsConstructor
	public static class MenuItem {
		private String name;  // 메뉴 이름
		private Integer price;  // 가격 (원 단위)
	}
}
