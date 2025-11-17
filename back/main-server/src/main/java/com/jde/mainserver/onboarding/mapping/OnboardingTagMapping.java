package com.jde.mainserver.onboarding.mapping;

import com.jde.mainserver.restaurants.entity.Tag.TagType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 온보딩 결과 → 태그 매핑 정의.
 * - 축(M/N, P/Q, S/A, T/D) 강도 및 빙고 메뉴 응답을 태그 점수에 기여하도록 변환한다.
 * - 각 항목의 weight는 1~3 단계이며, 축 강도/메뉴 투표에 곱해 최종 점수에 누적한다.
 */
public final class OnboardingTagMapping {

	/**
	 * 태그 참조: (유형, 이름, 가중치)
	 * - 유형은 ERD의 Tag.TagType와 일치해야 한다.
	 * - 이름은 DB의 tag.name과 일치해야 한다.
	 */
	public record TagRef(TagType type, String name, int weight) {}

	/** 축 코드 → 태그 리스트 매핑 (M,N,P,Q,S,A,T,D) */
	private static final Map<String, List<TagRef>> AXIS = new HashMap<>();
	/** 메뉴 ID(영문) → 태그 리스트 매핑 (V2__seed_onboarding_bingo.sql 기준) */
	private static final Map<String, List<TagRef>> MENU = new HashMap<>();

	static {
		// 1) Mood (M / N)
		putAxis("M", List.of(
			new TagRef(TagType.AMBIENCE, "고급스러운", 3),
			new TagRef(TagType.AMBIENCE, "아늑한", 3),
			new TagRef(TagType.AMBIENCE, "감성적인", 3),
			new TagRef(TagType.AMBIENCE, "조용한", 2),
			new TagRef(TagType.AMBIENCE, "뷰 좋은", 2),
			new TagRef(TagType.AMBIENCE, "루프탑", 2),
			new TagRef(TagType.TBC, "분위기좋은", 3),
			new TagRef(TagType.AMBIENCE, "로맨틱한", 2),
			new TagRef(TagType.AMBIENCE, "여유로운 분위기", 2)
		));
		putAxis("N", List.of(
			new TagRef(TagType.PURPOSE, "점심식사", 3),
			new TagRef(TagType.PURPOSE, "가성비 좋은 식사", 3),
			new TagRef(TagType.PURPOSE, "간단한 식사", 3),
			new TagRef(TagType.PURPOSE, "가벼운 점심", 2),
			new TagRef(TagType.PURPOSE, "간단한 저녁", 2),
			new TagRef(TagType.TBC, "가성비좋은", 2),
			new TagRef(TagType.PURPOSE, "직장인 점심에 적합한 분위기", 1)
		));

		// 2) Price (P / Q)
		putAxis("P", List.of(
			new TagRef(TagType.PURPOSE, "가성비 좋은 식사", 3),
			new TagRef(TagType.PURPOSE, "점심식사", 2),
			new TagRef(TagType.PURPOSE, "가벼운 점심", 2),
			new TagRef(TagType.PURPOSE, "간단한 식사", 2),
			new TagRef(TagType.TBC, "직장인점심", 2),
			new TagRef(TagType.TBC, "점심맛집", 2),
			new TagRef(TagType.TBC, "배달맛집", 1)
		));
		putAxis("Q", List.of(
			new TagRef(TagType.AMBIENCE, "고급스러운", 3),
			new TagRef(TagType.AMBIENCE, "프리미엄", 3),
			new TagRef(TagType.PRICE_AMENITY, "프라이빗룸", 3),
			new TagRef(TagType.TBC, "코스요리", 3),
			new TagRef(TagType.AMBIENCE, "품격 있는 분위기", 2),
			new TagRef(TagType.AMBIENCE, "고급스러운 분위기", 2),
			new TagRef(TagType.TBC, "한우오마카세", 2),
			new TagRef(TagType.TBC, "미쉐린가이드", 2)
		));

		// 3) Adventure (S / A)
		putAxis("A", List.of(
			new TagRef(TagType.FLAVOR, "이국적인", 3),
			new TagRef(TagType.AMBIENCE, "이국적인 인테리어", 2),
			new TagRef(TagType.TBC, "지중해요리", 2),
			new TagRef(TagType.TBC, "스페인요리", 2),
			new TagRef(TagType.TBC, "멕시코요리", 2),
			new TagRef(TagType.AMBIENCE, "베트남 느낌", 2),
			new TagRef(TagType.AMBIENCE, "태국 느낌", 2),
			new TagRef(TagType.FLAVOR, "자극적인", 2),
			new TagRef(TagType.FLAVOR, "중독적인", 2),
			new TagRef(TagType.TBC, "아메리칸차이니즈", 2)
		));
		putAxis("S", List.of(
			new TagRef(TagType.FLAVOR, "담백한", 3),
			new TagRef(TagType.FLAVOR, "깔끔한", 3),
			new TagRef(TagType.FLAVOR, "구수한", 2),
			new TagRef(TagType.FLAVOR, "자극적이지 않은", 2),
			new TagRef(TagType.TBC, "한식", 3),
			new TagRef(TagType.AMBIENCE, "가정식 느낌", 2),
			new TagRef(TagType.AMBIENCE, "집밥 느낌", 2),
			new TagRef(TagType.AMBIENCE, "전통적인", 2),
			new TagRef(TagType.TBC, "전통음식", 2)
		));

		// 4) Time (T / D)
		putAxis("T", List.of(
			new TagRef(TagType.PURPOSE, "점심식사", 3),
			new TagRef(TagType.PURPOSE, "가벼운 점심", 3),
			new TagRef(TagType.PURPOSE, "간단한 식사", 3),
			new TagRef(TagType.PURPOSE, "간식", 2),
			new TagRef(TagType.PURPOSE, "야식", 2),
			new TagRef(TagType.AMBIENCE, "캐주얼한", 2),
			new TagRef(TagType.AMBIENCE, "전형적인 분식집", 2),
			new TagRef(TagType.TBC, "치맥", 2),
			new TagRef(TagType.TBC, "분식카페", 2)
		));
		putAxis("D", List.of(
			new TagRef(TagType.AMBIENCE, "아늑한", 3),
			new TagRef(TagType.AMBIENCE, "여유로운 분위기", 3),
			new TagRef(TagType.AMBIENCE, "조용한 분위기", 3),
			new TagRef(TagType.AMBIENCE, "프라이빗한 분위기", 3),
			new TagRef(TagType.PRICE_AMENITY, "프라이빗룸", 3),
			new TagRef(TagType.PURPOSE, "브런치", 2),
			new TagRef(TagType.PURPOSE, "티타임", 2),
			new TagRef(TagType.TBC, "라운지바", 2),
			new TagRef(TagType.AMBIENCE, "루프탑", 2)
		));

		// 5) 메뉴 25개 매핑 (영문 ID 기준)
		// 1행
		putMenu("pineapple_pizza", List.of(
			new TagRef(TagType.FLAVOR, "달콤한", 3),
			new TagRef(TagType.FLAVOR, "새콤달콤한", 2),
			new TagRef(TagType.FLAVOR, "이국적인", 2),
			new TagRef(TagType.TBC, "피자", 2)
		));
		putMenu("cilantro", List.of(
			new TagRef(TagType.FLAVOR, "향긋한", 3),
			new TagRef(TagType.FLAVOR, "이국적인", 2),
			new TagRef(TagType.FLAVOR, "자극적인", 2)
		));
		putMenu("blue_cheese", List.of(
			new TagRef(TagType.FLAVOR, "크리미한", 3),
			new TagRef(TagType.FLAVOR, "강한 매운맛", 1),
			new TagRef(TagType.FLAVOR, "풍부한 향", 2),
			new TagRef(TagType.FLAVOR, "고급스러운", 2)
		));
		putMenu("durian", List.of(
			new TagRef(TagType.FLAVOR, "향긋한", 2),
			new TagRef(TagType.FLAVOR, "이국적인", 3),
			new TagRef(TagType.FLAVOR, "자극적인", 2)
		));
		putMenu("natto", List.of(
			new TagRef(TagType.FLAVOR, "정갈한", 2),
			new TagRef(TagType.FLAVOR, "이국적인", 2),
			new TagRef(TagType.FLAVOR, "자극적이지 않은", 2)
		));
		// 2행
		putMenu("mala_spicy_numbing", List.of(
			new TagRef(TagType.FLAVOR, "매운", 3),
			new TagRef(TagType.FLAVOR, "얼얼한", 3),
			new TagRef(TagType.FLAVOR, "자극적인", 3),
			new TagRef(TagType.FLAVOR, "중독적인", 2)
		));
		putMenu("offal_gopchang", List.of(
			new TagRef(TagType.FLAVOR, "구수한", 3),
			new TagRef(TagType.FLAVOR, "기름진", 2),
			new TagRef(TagType.FLAVOR, "진한", 2),
			new TagRef(TagType.FLAVOR, "잡내 없는", 2)
		));
		putMenu("anchovy", List.of(
			new TagRef(TagType.FLAVOR, "짭조름한", 3),
			new TagRef(TagType.FLAVOR, "짭쪼름한", 3),
			new TagRef(TagType.FLAVOR, "이국적인", 2),
			new TagRef(TagType.FLAVOR, "풍부한 향", 2)
		));
		putMenu("olive", List.of(
			new TagRef(TagType.FLAVOR, "향긋한", 2),
			new TagRef(TagType.FLAVOR, "산뜻한", 2),
			new TagRef(TagType.FLAVOR, "이국적인", 2)
		));
		putMenu("kimchi_strong", List.of(
			new TagRef(TagType.FLAVOR, "매콤한", 2),
			new TagRef(TagType.FLAVOR, "알싸한", 3),
			new TagRef(TagType.FLAVOR, "자극적인", 2),
			new TagRef(TagType.FLAVOR, "깊은 감칠맛", 2)
		));
		// 3행
		putMenu("sashimi", List.of(
			new TagRef(TagType.FLAVOR, "신선한", 3),
			new TagRef(TagType.FLAVOR, "깔끔한", 2),
			new TagRef(TagType.FLAVOR, "시원한", 2),
			new TagRef(TagType.TBC, "사시미 추천", 2)
		));
		putMenu("yukhoe", List.of(
			new TagRef(TagType.FLAVOR, "신선한", 3),
			new TagRef(TagType.FLAVOR, "육즙 가득", 2),
			new TagRef(TagType.FLAVOR, "고급스러운", 2),
			new TagRef(TagType.TBC, "트러플육회 추천", 1)
		));
		putMenu("pyeongyang_naengmyeon", List.of(
			new TagRef(TagType.FLAVOR, "담백한", 3),
			new TagRef(TagType.FLAVOR, "깔끔한", 3),
			new TagRef(TagType.FLAVOR, "시원한", 2),
			new TagRef(TagType.FLAVOR, "자극적이지 않은", 2)
		));
		putMenu("tteokbokki", List.of(
			new TagRef(TagType.FLAVOR, "매콤달콤한", 3),
			new TagRef(TagType.FLAVOR, "매콤달콤", 3),
			new TagRef(TagType.FLAVOR, "자극적인", 2),
			new TagRef(TagType.PURPOSE, "간식", 2),
			new TagRef(TagType.PURPOSE, "야식", 2)
		));
		putMenu("salad", List.of(
			new TagRef(TagType.FLAVOR, "상큼한", 3),
			new TagRef(TagType.FLAVOR, "산뜻한", 3),
			new TagRef(TagType.PURPOSE, "다이어트", 3),
			new TagRef(TagType.PURPOSE, "건강한 식사", 3)
		));
		// 4행
		putMenu("lamb_mutton", List.of(
			new TagRef(TagType.FLAVOR, "고급진", 3),
			new TagRef(TagType.FLAVOR, "불향 가득", 2),
			new TagRef(TagType.FLAVOR, "향긋한", 2),
			new TagRef(TagType.FLAVOR, "잡내 없는", 2)
		));
		putMenu("truffle_oil", List.of(
			new TagRef(TagType.FLAVOR, "트러플 향", 3),
			new TagRef(TagType.FLAVOR, "풍부한 향", 3),
			new TagRef(TagType.FLAVOR, "고급스러운", 2)
		));
		putMenu("cheonggukjang", List.of(
			new TagRef(TagType.FLAVOR, "구수한", 3),
			new TagRef(TagType.FLAVOR, "깊은", 2),
			new TagRef(TagType.FLAVOR, "걸쭉한", 2),
			new TagRef(TagType.FLAVOR, "자극적인", 1)
		));
		putMenu("uni", List.of(
			new TagRef(TagType.FLAVOR, "크리미한", 3),
			new TagRef(TagType.FLAVOR, "고급스러운", 3),
			new TagRef(TagType.FLAVOR, "풍미 가득한", 2)
		));
		putMenu("mint_chocolate", List.of(
			new TagRef(TagType.FLAVOR, "상큼한", 2),
			new TagRef(TagType.FLAVOR, "달콤한", 3),
			new TagRef(TagType.FLAVOR, "이국적인", 2),
			new TagRef(TagType.FLAVOR, "중독적인", 1)
		));
		// 5행
		putMenu("jajangmyeon", List.of(
			new TagRef(TagType.FLAVOR, "달콤짭짤한", 3),
			new TagRef(TagType.FLAVOR, "달짝지근한", 3),
			new TagRef(TagType.FLAVOR, "기름진", 2),
			new TagRef(TagType.FLAVOR, "푸짐한", 2)
		));
		putMenu("jokbal", List.of(
			new TagRef(TagType.FLAVOR, "쫄깃한", 3),
			new TagRef(TagType.FLAVOR, "구수한", 2),
			new TagRef(TagType.FLAVOR, "기름진", 2),
			new TagRef(TagType.FLAVOR, "풍미 가득한", 2)
		));
		putMenu("yangnyeom_chicken", List.of(
			new TagRef(TagType.FLAVOR, "매콤달콤한", 3),
			new TagRef(TagType.FLAVOR, "달콤짭조름한", 2),
			new TagRef(TagType.FLAVOR, "자극적인", 2),
			new TagRef(TagType.PURPOSE, "치맥", 2)
		));
		putMenu("sundae", List.of(
			new TagRef(TagType.FLAVOR, "구수한", 3),
			new TagRef(TagType.FLAVOR, "푸짐한", 2),
			new TagRef(TagType.FLAVOR, "깊은 맛", 2)
		));
		putMenu("smoke_barbecue", List.of(
			new TagRef(TagType.FLAVOR, "스모키한", 3),
			new TagRef(TagType.FLAVOR, "불맛", 3),
			new TagRef(TagType.FLAVOR, "불향 가득", 3),
			new TagRef(TagType.FLAVOR, "진한", 2),
			new TagRef(TagType.FLAVOR, "풍미 깊은", 2)
		));
	}

	private static void putAxis(String code, List<TagRef> refs) {
		AXIS.put(code, new ArrayList<>(refs));
	}
	private static void putMenu(String id, List<TagRef> refs) {
		MENU.put(id, new ArrayList<>(refs));
	}

	/** 축 코드 → 태그 리스트 반환 (없으면 빈 리스트) */
	public static List<TagRef> getAxis(String code) {
		return AXIS.getOrDefault(code, List.of());
	}

	/** 메뉴 ID(영문) → 태그 리스트 반환 (없으면 빈 리스트) */
	public static List<TagRef> getMenu(String id) {
		return MENU.getOrDefault(id, List.of());
	}
}


