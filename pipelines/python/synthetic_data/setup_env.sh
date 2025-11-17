#!/bin/bash
# 가상환경 설정 스크립트 (Git Bash)

# 가상환경 생성
python -m venv venv

# 가상환경 활성화
source venv/bin/activate

# 필요한 패키지 설치
# pip 업그레이드는 Windows 권한 문제로 제외 (선택사항)
pip install pandas numpy pydantic

# fastapi-score의 requirements는 Python 버전 호환성 문제로 제외
# 실제로 필요한 것만 설치 (pandas, numpy, pydantic은 이미 설치됨)

echo "가상환경 설정 완료!"
echo "활성화: source venv/bin/activate"

