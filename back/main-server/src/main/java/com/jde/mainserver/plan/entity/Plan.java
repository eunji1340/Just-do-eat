package com.jde.mainserver.plan.entity;

import com.jde.mainserver.global.common.BaseEntity;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.plan.entity.enums.PlanDecisionTool;
import com.jde.mainserver.plan.entity.enums.PlanPriceRange;
import com.jde.mainserver.plan.entity.enums.PlanStatus;
import com.jde.mainserver.restaurants.entity.Restaurant;

// JPA (Jakarta Persistence)  관련, 엔티티와 DB 매핑할 때 사용하는 어노테이션
import jakarta.persistence.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Lombok 관련, 반복 코드(Getter, 생성자, Builder 등)를 자동으로 생성해주는 라이브러리
import lombok.Getter; // 모든 필드의 getter 메서드 자동 생성
import lombok.NoArgsConstructor; // 파라미터 없는 생성자 자동 생성
import lombok.AllArgsConstructor; // 모든 필드를 받는 생성자 자동 생성
import lombok.AccessLevel; // 생성자 접근 수준 지정할 때 사용
import lombok.Builder; // 빌더 패턴 자동 생성

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "plan")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Plan extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "plan_id")
	private Long planId;

	@Size(max = 10)
	@Column(name = "plan_name", length = 10, nullable = false)
	private String planName;

	@JdbcTypeCode(SqlTypes.GEOMETRY)
	@Column(name = "plan_geom", columnDefinition = "geometry(Point,4326)", nullable = false)
	private Point planGeom;

	@Column(name = "radius_m")
	private Integer radiusM;

	// DateTime? LocalDateTime?
	@Column(name = "starts_at")
	private LocalDateTime startsAt;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "dislike_categories", columnDefinition = "jsonb")
	private List<String> dislikeCategories;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "price_range", columnDefinition = "jsonb")
	private List<PlanPriceRange> priceRanges;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false)
	private PlanStatus status;

	@Enumerated(EnumType.STRING)
	@Column(name = "decision_tool")
	private PlanDecisionTool decisionTool;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "room_id", nullable = false)
	private Room room;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "restaurant_id")
	private Restaurant restaurant;

	@OneToMany(mappedBy = "plan", fetch = FetchType.LAZY)
	private List<PlanParticipant> planParticipantList;

	// 결정 도구 설정용 setter
	public void setDecisionTool(PlanDecisionTool decisionTool) {
		this.decisionTool = decisionTool;
	}

	// 상태 변경용 setter
	public void setStatus(PlanStatus status) {
		this.status = status;
	}

	// 확정 식당 설정용 setter
	public void setRestaurant(Restaurant restaurant) {
		this.restaurant = restaurant;
	}
}
