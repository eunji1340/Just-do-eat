package com.JDE.mainserver.restaurants.service;

import com.JDE.mainserver.restaurants.dto.RestaurantDtos;
import com.JDE.mainserver.restaurants.entity.Restaurant;
import com.JDE.mainserver.restaurants.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    /** 키워드 검색 (이름 부분일치) */
    public Page<RestaurantDtos.Summary> searchByKeyword(String query, Pageable pageable) {
        Page<Restaurant> page = (query == null || query.isBlank())
                ? restaurantRepository.findAllWithHours(pageable)
                : restaurantRepository.findByNameContainingIgnoreCase(query, pageable);

        return page.map(this::toSummary);
    }

    /** 상세 */
    public RestaurantDtos.Detail getDetail(Long id) {
        Restaurant r = restaurantRepository.findById(id).orElseThrow();
        return toDetail(r);
    }

    /** 공유 링크 */
    public RestaurantDtos.ShareResp share(Long restaurantId) {
        Restaurant r = restaurantRepository.findById(restaurantId).orElseThrow();
        return RestaurantDtos.ShareResp.builder()
                .restaurantId(r.getId())
                .link(r.getWebsiteUrl())
                .title(r.getName())
                .build();
    }

    /* ==================== Mappers ==================== */

    private RestaurantDtos.Summary toSummary(Restaurant r) {
        return RestaurantDtos.Summary.builder()
                .id(r.getId())
                .name(r.getName())
                .category(r.getCategory())
                .rating(r.getRating())
                .priceRange(r.getPriceRange())
                .address(r.getAddress())
                .thumbnail(firstOrNull(r.getImages()))
                .build();
    }

    private RestaurantDtos.Detail toDetail(Restaurant r) {
        return RestaurantDtos.Detail.builder()
                .id(r.getId())
                .name(r.getName())
                .address(r.getAddress())
                .phone(r.getPhone())
                .summary(r.getSummary())
                .images(r.getImages())
                .category(r.getCategory())
                .rating(r.getRating())
                .priceRange(r.getPriceRange())
                .websiteUrl(r.getWebsiteUrl())
                .menu(r.getMenu())
                .build();
    }

    private String firstOrNull(List<String> list) {
        return (list == null || list.isEmpty()) ? null : list.get(0);
    }
}
