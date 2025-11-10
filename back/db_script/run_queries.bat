@echo off
chcp 65001 > nul
echo ======================================================================
echo            쿼리 예제 실행
echo ======================================================================
echo.

PowerShell -ExecutionPolicy Bypass -File run_queries.ps1

echo.
pause
