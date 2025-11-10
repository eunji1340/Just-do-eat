@echo off
chcp 65001 > nul
echo ======================================================================
echo            테이블 샘플 데이터 확인
echo ======================================================================
echo.

PowerShell -ExecutionPolicy Bypass -File show_sample_data.ps1

echo.
pause
