@echo off
title Apartment Management - Stop Servers
setlocal EnableDelayedExpansion

echo =====================================================================
echo    Stopping Apartment Visitor and Maintenance Management Servers
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/2] Terminating any process listening on port 5000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Terminating PID %%a...
    taskkill /F /PID %%a >nul 2>nul
)

echo [2/2] Terminating any process listening on port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Terminating PID %%a...
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo [OK] Both servers have been stopped.
echo.
pause
