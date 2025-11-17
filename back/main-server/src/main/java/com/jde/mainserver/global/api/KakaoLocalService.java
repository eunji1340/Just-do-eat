package com.jde.mainserver.global.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class KakaoLocalService {

    private final String KAKAO_API_URL = "http://dapi.kakao.com/v2/local/geo/coord2address.json";
    @Value("${custom.kakao-api-key}")
    private String KAKAO_REST_API_KEY;

    public String getAddress(Point point) {

        String longitude = String.format("%.6f", point.getX());
        String latitude = String.format("%.6f", point.getY());

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(KAKAO_API_URL)
                .queryParam("x", longitude)
                .queryParam("y", latitude);

        HttpHeaders headers= new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + KAKAO_REST_API_KEY);

        HttpEntity<?> entity = new HttpEntity<>(headers);

        RestTemplate restTemplate = new RestTemplate();

        ResponseEntity<String> response = restTemplate.exchange(
                builder.toUriString(),
                HttpMethod.GET,
                entity,
                String.class
        );

        return response.getBody();
    }

    public String getAddressName(Point point) {
        try {
            String json = getAddress(point);


            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);

            JsonNode documents = root.path("documents");
            if (documents.isArray() && documents.size() > 0) {
                JsonNode addr = documents.get(0).path("road_address").path("address_name");

                if (!addr.isMissingNode()) {
                    return addr.asText();
                }
                return documents.get(0).path("address").path("address_name").asText();
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
