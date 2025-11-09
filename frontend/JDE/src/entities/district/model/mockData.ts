// src/entities/district/model/mockData.ts
// 목적: 인기 상권 Mock 데이터

import type { District } from "./types";

/**
 * 인기 상권 목록 (MVP)
 */
export const popularDistricts: District[] = [
  {
    id: "yeoksam",
    name: "역삼역",
    address: "서울 강남구 테헤란로 212",
    city: "서울",
    district: "강남구",
  },
  {
    id: "yuseong",
    name: "유성구",
    address: "대전 유성구 동서대로 98-39",
    city: "대전",
    district: "유성구",
  },
  {
    id: "gwangsan",
    name: "광산구",
    address: "광주광역시 광산구 하남산단 6번로 107",
    city: "광주",
    district: "광산구",
  },
  {
    id: "gangseo",
    name: "강서구",
    address: "부산 강서구 송정동 녹산산업중로 333",
    city: "부산",
    district: "강서구",
  },
  {
    id: "gumi",
    name: "구미 3공단",
    address: "구미시 3공단 3로 302",
    city: "구미",
    district: "3공단",
  },
];
