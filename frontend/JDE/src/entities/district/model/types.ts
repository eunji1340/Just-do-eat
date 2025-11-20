// src/entities/district/model/types.ts
// 목적: 상권(District) 엔티티 타입 정의

/**
 * 상권 정보
 */
export interface District {
  /** 상권 ID */
  id: string;
  /** 상권 이름 (예: "역삼역", "유성구") */
  name: string;
  /** 상권 전체 주소 */
  address: string;
  /** 시/도 */
  city: string;
  /** 구/군 */
  district: string;
}
