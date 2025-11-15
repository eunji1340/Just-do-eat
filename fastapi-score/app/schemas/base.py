# app/schemas/base.py
# FastAPI 점수 엔진 공통 타입
# Author: Jang
# Date: 2025-10-29

from pydantic import BaseModel
from typing import Optional, Dict

class Score(BaseModel):
    restaurant_id: int
    score: float
    debug: Optional[Dict] = None  # debug=1일 때 가산/감점 이유 등