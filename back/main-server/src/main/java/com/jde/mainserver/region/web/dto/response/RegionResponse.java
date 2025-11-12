package com.jde.mainserver.region.web.dto.response;

import com.jde.mainserver.region.entity.Region;
import org.locationtech.jts.geom.Coordinate;

public record RegionResponse(
        Long regionId,
        String name,
        String address,
        double lat,
        double lng
) {
    public static RegionResponse from(Region r) {
        Coordinate c = r.getGeom().getCoordinate();
        return new RegionResponse(
                r.getId(),
                r.getName(),
                r.getAddress(),
                c.getY(), // lat
                c.getX()  // lng
        );
        // 위/경도 저장 순서는 (x=lng, y=lat)라서 주의!
    }
}
