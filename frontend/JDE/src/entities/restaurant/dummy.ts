// src/entities/restaurant/dummy.ts
// 목적: 임시 데이터 제공 (API 확정 전까지 사용)
// 교체 포인트: 실제 API 연동 시 이 파일 제거 후 widgets에서 API 호출로 대체

import type { Restaurant } from './types'

export const DUMMY_RESTAURANTS: Restaurant[] = [
  { id: 'r1', name: '봉추찜닭', rating: 4.6, likeCount: 128, distanceMeters: 340, primaryMenu: '찜닭' },
  { id: 'r2', name: '을지로 골뱅이', rating: 4.4, likeCount: 93, distanceMeters: 510, primaryMenu: '골뱅이무침' },
  { id: 'r3', name: '마포돼지갈비', rating: 4.7, likeCount: 201, distanceMeters: 790, primaryMenu: '갈비' },
  { id: 'r4', name: '성수 닭꼬치', rating: 4.3, likeCount: 77, distanceMeters: 260, primaryMenu: '닭꼬치' },
  { id: 'r5', name: '역삼 돈카츠', rating: 4.5, likeCount: 156, distanceMeters: 620, primaryMenu: '돈카츠' },
  { id: 'r6', name: '홍대 파스타집', rating: 4.2, likeCount: 88, distanceMeters: 980, primaryMenu: '파스타' },
  { id: 'r7', name: '건대 김치찌개', rating: 4.1, likeCount: 66, distanceMeters: 410, primaryMenu: '찌개' },
  { id: 'r8', name: '이태원 타코', rating: 4.5, likeCount: 140, distanceMeters: 1240, primaryMenu: '타코' },
  { id: 'r9', name: '서촌 국수', rating: 4.0, likeCount: 52, distanceMeters: 300, primaryMenu: '국수' },
  { id: 'r10', name: '강남 초밥', rating: 4.8, likeCount: 310, distanceMeters: 1430, primaryMenu: '초밥' },
]
