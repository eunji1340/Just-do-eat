/**
 * restaurants/converter/CategoryMapper.java
 * 카테고리 매핑 유틸리티
 * Author: Jang
 * Date: 2025-11-11
 */

package com.jde.mainserver.restaurants.converter;

import java.util.*;

public class CategoryMapper {

	private static final Map<String, List<String>> CATEGORY_MAPPING = Map.ofEntries(
		Map.entry("한식", List.of("한식", "기사식당", "구내식당")),
		Map.entry("중식", List.of("중식")),
		Map.entry("일식", List.of("일식", "샤브샤브")),
		Map.entry("양식", List.of("양식")),
		Map.entry("분식", List.of("분식", "푸드코트")),
		Map.entry("치킨", List.of("치킨")),
		Map.entry("패스트푸드", List.of("패스트푸드")),
		Map.entry("디저트", List.of("간식")),
		Map.entry("샐러드", List.of("샐러드")),
		Map.entry("아시아/퓨전", List.of("아시아음식", "퓨전요리")),
		Map.entry("뷔페/패밀리", List.of("뷔페", "패밀리레스토랑")),
		Map.entry("술집", List.of("술집"))
	);

	// 프론트엔드 카테고리명을 DB category2 값 리스트로 변환
	public static List<String> getCategory2List(String frontendCategory) {
		if (frontendCategory == null || frontendCategory.isBlank()) {
			return Collections.emptyList();
		}
		return CATEGORY_MAPPING.getOrDefault(frontendCategory, Collections.emptyList());
	}

	// 유효한 프론트엔드 카테고리명인지 확인
	public static boolean isValidCategory(String frontendCategory) {
		return frontendCategory != null && CATEGORY_MAPPING.containsKey(frontendCategory);
	}

	// 모든 프론트엔드 카테고리명 리스트 반환
	public static Set<String> getAllCategories() {
		return CATEGORY_MAPPING.keySet();
	}
}

