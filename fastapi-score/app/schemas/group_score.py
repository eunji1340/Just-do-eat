# app/schemas/group_score.py
# 그룹(모임/약속) 추천 점수 엔드포인트 요청/응답 스키마
# Author: Jang
# Date: 2025-10-29

from typing import List, Dict, Optional
from pydantic import BaseModel, Field

from .features import UserPrefFeature, CandidateFeature


class GroupScoreRequest(BaseModel):
    """
    그룹 추천 점수 계산 요청 DTO
    - members: 참여자들의 선호/바이어스(온보딩+행동 누적)
    - candidates: 점수 계산 대상 후보 식당들
    - debug: True면 후보별 디버그 정보를 포함
    """
    members: List[UserPrefFeature] = Field(min_length=1)
    candidates: List[CandidateFeature] = Field(min_length=1)
    debug: Optional[bool] = False

class PerCandidateGroupScore(BaseModel):
    """
    후보별 그룹 점수 상세
    - restaurant_id: 식당 ID
    - per_user: 개인별 점수 목록 {user_id: score}
    - group_score: 그룹 최종 점수(개인 점수 평균)
    - debug: 디버그(평균에 참여한 인원 수, 주요 드라이버 등)
    """
    restaurant_id: int
    per_user: Dict[int, float]
    group_score: float
    debug: Optional[Dict] = None

class GroupScoreResponse(BaseModel):
    """
    그룹 추천 점수 계산 응답 DTO
    - results: 후보별 개인 점수 목록
    - algo_version: 알고리즘/가중치 버전 문자열
    - elapsed_ms: 점수 계산 소요 시간(밀리초)
    """
    results: List[PerCandidateGroupScore] = Field(min_length=1)
    algo_version: str
    elapsed_ms: int