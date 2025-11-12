package com.jde.mainserver.region.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "region")
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "region_id")
    private Long id;

    @Column(length = 50, nullable = false)
    private String name;

    @Column(length = 255, nullable = false)
    private String address;

    // PostGIS 컬럼 매핑 (hibernate-spatial 필요)

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    private Point geom;

    // created_at / updated_at 컬럼은 DB가 채우므로 매핑은 생략해도 됩니다.
}
