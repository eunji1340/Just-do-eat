@echo off
chcp 65001 > nul
echo ======================================================================
echo            데이터 검증 및 통계
echo ======================================================================
echo.

PowerShell -ExecutionPolicy Bypass -File run_validation.ps1

echo.
pause
