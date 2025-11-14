package com.jde.mainserver.member.dto.response;

import com.jde.mainserver.region.entity.Region;

public record MemberRegionResponse(Long region_id, String name, String address) {
    public static MemberRegionResponse of(Region r) {
        if (r == null) return new MemberRegionResponse(null, null, null);
        return new MemberRegionResponse(r.getId(), r.getName(), r.getAddress());
    }
}
