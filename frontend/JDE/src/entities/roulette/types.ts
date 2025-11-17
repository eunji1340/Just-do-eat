// 목적: 룰렛 도메인 타입만 정의 (단일 책임)
// 교체 포인트: 추후 label/색상/가중치 스키마 변경 시 이 파일만 수정

export type RouletteItem = {
  id: string; // 고유 식별자 (ex. restaurant id)
  label: string; // 표시 텍스트 (식당명)
  weight?: number; // 가중치(선택 확률). 기본 1
  color?: string; // 섹터 배경색. 지정 없으면 자동 팔레트
};
