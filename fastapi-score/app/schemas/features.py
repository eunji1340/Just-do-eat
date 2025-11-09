# app/schemas/features.py
# 유저/후보 식당 특징 스키마
# Author: Jang
# Date: 2025-10-29

from pydantic import BaseModel, Field
from typing import Dict
from .base import PriceBucket

class TagPreference(BaseModel):
    """
    User_tag_pref와 Restaurant_tag의 공통 표현
    - User_tag_pref: score (DECIMAL(4,2))
    - Restaurant_tag: weight (DECIMAL(3,2))
    - score와 weight 중 하나만 있으면 됨 (사용자 태그는 score, 식당 태그는 weight)
    """
    score: float | None = Field(None, ge=-99.99, le=99.99, description="태그 점수 (ERD: user_tag_pref.score)")
    weight: float | None = Field(None, ge=-9.99, le=9.99, description="태그 가중치 (ERD: restaurant_tag.weight)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="태그 확신도")
    
    def get_value(self) -> float:
        """score 또는 weight 중 하나를 반환 (우선순위: score > weight)"""
        return self.score if self.score is not None else (self.weight if self.weight is not None else 0.0)

class CandidateFeature(BaseModel):
    """
    후보 식당 특징
    - Restaurant_tag 테이블 기반: tag_pref (Map<tag_id, TagPreference>)
    - 모든 속성/카테고리/메뉴는 Tag로 통합되어 tag_pref에 포함
    """
    restaurant_id: int
    distance_m: float = Field(..., description="거리(미터)")
    is_open: bool = Field(..., description="영업 중 여부")
    price_bucket: PriceBucket = Field(..., description="가격대")
    tag_pref: Dict[int, TagPreference] = Field(
        default_factory=dict,
        description="ERD: Restaurant_tag - {tag_id: {weight, confidence}}"
    )
    pref_score: float | None = Field(
        default=None,
        description="User_Restaurant_State.pref_score 전달용 개인 선호 점수"
    )

class UserPrefFeature(BaseModel):
    """
    사용자 선호도
    - User_tag_pref 테이블 기반: tag_pref (Map<tag_id, TagPreference>)
    - User_type 정보는 향후 확장 가능
    """
    user_id: int
    tag_pref: Dict[int, TagPreference] = Field(
        default_factory=dict,
        description="User_tag_pref - {tag_id: {score, confidence}}"
    )
    saved: list[int] = Field(
        default_factory=list,
        description="저장한 식당 ID 목록"
    )
    rest_bias: Dict[int, float] = Field(
        default_factory=dict,
        description="식당별 편향치 {restaurant_id: -1.0~+1.0} (User_Restaurant_State.pref_score 기반)"
    )

class ContextFeature(BaseModel):
    """
    시간/위치 컨텍스트
    """
    lat: float
    lng: float
    dow: int = Field(..., ge=0, le=6, description="요일(0:월~6:일)")
    hour: int = Field(..., ge=0, le=23, description="시간(0~23)")
