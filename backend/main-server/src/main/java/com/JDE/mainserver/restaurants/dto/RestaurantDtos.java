package com.JDE.mainserver.restaurants.dto;

import com.JDE.mainserver.restaurants.entity.Restaurant;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

public class RestaurantDtos {

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Summary {
        private Long id;
        private String name;
        private String category;
        private BigDecimal rating;              // 엔티티와 동일
        private Restaurant.PriceBucket priceRange;
        private String address;
        private String thumbnail;               // images 첫 번째
    }

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Detail {
        private Long id;
        private String name;
        private String address;
        private String phone;
        private String summary;
        private List<String> images;            // 엔티티와 동일
        private String category;
        private BigDecimal rating;
        private Restaurant.PriceBucket priceRange;
        private String websiteUrl;
        private List<Restaurant.MenuItem> menu; // 엔티티와 동일
    }

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class ShareResp {
        private Long restaurantId;
        private String link;   // 카카오/구글 등 외부 링크
        private String title;
    }
}
