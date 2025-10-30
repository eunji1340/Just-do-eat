// src/entities/restaurant/types.ts
// 목적: 도메인 타입 선언 (단일 책임)
// 교체 포인트: 백엔드 스키마가 확정되면 필드명 동기화

export type RestaurantId = string

export type Restaurant = {
  id: RestaurantId
  name: string
  thumbnailUrl?: string
  distanceMeters?: number
  likeCount?: number
  rating?: number
  primaryMenu?: string
  address?: string
}
