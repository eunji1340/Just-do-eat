# Python 3.9 호환 스키마 (fastapi-score/app/schemas/features.py의 호환 버전)
# Python 3.9에서는 float | None 대신 Optional[float] 사용

from pydantic import BaseModel, Field
from typing import Dict, Optional

class TagPreference(BaseModel):
    """
    User_tag_pref와 Restaurant_tag의 공통 표현
    - User_tag_pref: score (DECIMAL(4,2))
    - Restaurant_tag: weight (DECIMAL(3,2))
    - score와 weight 중 하나만 있으면 됨 (사용자 태그는 score, 식당 태그는 weight)
    """
    score: Optional[float] = Field(None, ge=-99.99, le=99.99, description="태그 점수 (ERD: user_tag_pref.score)")
    weight: Optional[float] = Field(None, ge=-9.99, le=9.99, description="태그 가중치 (ERD: restaurant_tag.weight)")
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
    tag_pref: Dict[int, TagPreference] = Field(
        default_factory=dict,
        description="ERD: Restaurant_tag - {tag_id: {weight, confidence}}"
    )
    pref_score: Optional[float] = Field(
        default=None,
        description="User_Restaurant_State.pref_score 전달용 개인 선호 점수"
    )
    has_interaction_recent: Optional[bool] = Field(
        default=None,
        description="최근 30일 내 상호작용 여부 (SAVE/SHARE/SELECT/VIEW) - 콜드스타트 감쇠용"
    )
    engagement_boost: Optional[float] = Field(
        default=None,
        description="최근 14일 내 행동 부스트 점수 (상한 0.25) - SAVE +0.15, SHARE +0.10, SELECT +0.20, VIEW(첫 1회) +0.03"
    )

class UserPrefFeature(BaseModel):
    """
    사용자 선호도
    - User_tag_pref 테이블 기반: tag_pref (Map<tag_id, TagPreference>)
    """
    user_id: int
    tag_pref: Dict[int, TagPreference] = Field(
        default_factory=dict,
        description="User_tag_pref - {tag_id: {score, confidence}}"
    )

