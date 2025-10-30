// --------------------------------------------
// features/Onboarding/Bingo/model/bingo-types.ts
// --------------------------------------------
export type Tag =
  | 'spicy_chili'
  | 'mala_numbing'
  | 'fermented'
  | 'raw'
  | 'noodle'
  | 'broth'
  | 'grilled_roasted'
  | 'fried'
  | 'sweet'
  | 'strong_aroma'
  | 'fresh_light'
  | 'offal_texture';

export type BingoItem = { id: string; label: string };

export type Tri = -1 | 0 | 1; // DISLIKE | SKIP | LIKE

export type ItemWeights = Record<Tag, number>;

export type TagWeightsMap = Record<string, ItemWeights>; // key = item.id

export type TagPrefs = Partial<Record<Tag, number>>; // 0~1 정규화 결과
