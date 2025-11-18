import type {
  CandidateRestaurant,
  Restaurant,
} from "@/entities/plan/model/types";

// CandidateRestaurant를 Restaurant로 변환
export const mapCandidateToRestaurant = (
  candidate: CandidateRestaurant
): Restaurant => {
  // 대표 메뉴 2개 추출 (is_recommend 또는 is_ai_mate가 true인 것 우선)
  const recommendedMenus = candidate.menu.filter(
    (m) => m.is_recommend || m.is_ai_mate
  );
  const displayMenus =
    recommendedMenus.length >= 2
      ? recommendedMenus.slice(0, 2)
      : candidate.menu.slice(0, 2);

  return {
    id: candidate.restaurant.restaurant_id.toString(),
    name: candidate.restaurant.name,
    category: candidate.restaurant.category2 || candidate.restaurant.category1,
    imageUrl: candidate.restaurant.image || "",
    signatureMenus: displayMenus.map((m) => m.name),
    likesCount: candidate.restaurant.saved_count ?? 0,
  };
};
