# app/schemas/base.py
# FastAPI 점수 엔진 공통 타입
# Author: Jang
# Date: 2025-10-29

from enum import IntEnum
from pydantic import BaseModel
from typing import Optional, Dict

class PriceBucket(IntEnum):
    price_0_10000 = 0
    price_10000_20000 = 1
    price_20000_30000 = 2
    price_30000_40000 = 3
    price_40000_UP = 4

class AlcoholFlag(IntEnum):
    NO = 0
    YES = 1

class Score(BaseModel):
    restaurant_id: int
    score: float
    debug: Optional[Dict] = None # debug=1일 때 가산/감점 이유 등