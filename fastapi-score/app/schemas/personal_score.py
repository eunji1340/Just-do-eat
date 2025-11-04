# app/schemas/personal_score.py
# 개인 점수 엔드포인트 요청/응답 스키마
# Author: Jang
# Date: 2025-10-29

from typing import List, Optional
from pydantic import BaseModel, Field

from .features import UserPrefFeature, CandidateFeature
from .base import Score


class PersonalScoreRequest(BaseModel):
    """
    개인 추천 점수 계산 요청 DTO
    - user: 사용자 선호/바이어스(온보딩+행동 누적)
    - candidates: 점수 계산 대상 후보 식당들
    - debug: True면 점수 구성요소 요약을 Score.debug에 포함
    """
    user: UserPrefFeature
    candidates: List[CandidateFeature] = Field(min_length=1)
    debug: Optional[bool] = False

class PersonalScoreResponse(BaseModel):
    """
    개인 추천 점수 계산 응답 DTO
    - scores: 후보별 점수 목록
    - algo_version: 알고리즘/가중치 버전 문자열
    - elapsed_ms: 점수 계산 소요 시간(밀리초)
    """
    scores: List[Score] = Field(min_length=1)
    algo_version: str
    elapsed_ms: int
