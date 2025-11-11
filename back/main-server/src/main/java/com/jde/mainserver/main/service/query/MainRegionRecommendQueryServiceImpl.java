package com.jde.mainserver.main.service.query;

import com.jde.mainserver.main.web.dto.response.MainRegionRecommendResponse;
import com.jde.mainserver.member.dto.response.MemberRegionResponse;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MainRegionRecommendQueryServiceImpl implements MainRegionRecommendQueryService {

    private final MemberRepository memberRepository;
    private final RestaurantRepository restaurantRepository;

    @Override
    public MainRegionRecommendResponse overview(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("member not found"));

        var region = member.getRegion();
        if (region == null) {
            return new MainRegionRecommendResponse(false, null, List.of());
        }

        var p = region.getGeom();
        double lng = p.getX();
        double lat = p.getY();

        var page = restaurantRepository.findNearestWithinMeters(
                lng, lat, 800, org.springframework.data.domain.PageRequest.of(0, 20)
        );

        var items = page.getContent().stream()
                .map(r -> new MainRegionRecommendResponse.RestaurantItem(
                        r.getId(),
                        r.getName()
                ))
                .toList();

        return new MainRegionRecommendResponse(
                true,
                MemberRegionResponse.of(region),
                items
        );
    }

    @Override
    public MainRegionRecommendResponse recommendations(Long memberId) {
        return overview(memberId);
    }
}
