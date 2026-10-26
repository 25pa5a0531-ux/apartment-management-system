@echo off
title Apartment Management - Launcher
setlocal EnableDelayedExpansion

echo =====================================================================
echo    Apartment Visitor and Maintenance Management System Launcher
echo =====================================================================
echo.

:: 1. Navigate to script root directory
cd /d "%~dp0"

:: 2. Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please download and install Node.js (v18 or higher) from https://nodejs.org/
    echo After installing, reopen this script.
    echo.
    pause
    exit /b 1
)

:: 3. Determine npm command (npm.cmd or npm)
set NPM_CMD=npm
where npm.cmd >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set NPM_CMD=npm.cmd
)

echo [OK] Node.js detected:
node -v
echo [OK] Package manager detected: %NPM_CMD%
echo.

:: 4. Verify Server Configuration (.env)
if not exist "server\.env" (
    echo [INFO] Generating default server\.env configuration...
    (
        echo PORT=5000
        echo JWT_SECRET=apartment_management_secret_key_college_project_2026
        echo NODE_ENV=development
    ) > "server\.env"
    echo [OK] server\.env created.
)

:: 5. Check Server Dependencies
if not exist "server\node_modules" (
    echo [INFO] Server dependencies not found. Installing...
    cd /d "%~dp0server"
    call %NPM_CMD% install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install server dependencies!
        pause
        exit /b 1
    )
    cd /d "%~dp0"
    echo [OK] Server dependencies installed.
)

:: 6. Check Client Dependencies
if not exist "client\node_modules" (
    echo [INFO] Client dependencies not found. Installing...
    cd /d "%~dp0client"
    call %NPM_CMD% install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install client dependencies!
        pause
        exit /b 1
    )
    cd /d "%~dp0"
    echo [OK] Client dependencies installed.
)

echo.
echo =====================================================================
echo    Starting Backend & Frontend Servers...
echo =====================================================================
echo.

:: 7. Launch Backend Server in a new window
echo [1/2] Launching Backend Server on port 5000...
start "Apartment Backend Server (Port 5000)" cmd.exe /k "cd /d \"%~dp0server\" && %NPM_CMD% start"

:: Give backend 2 seconds to bind
timeout /t 2 /nobreak >nul

:: 8. Launch Frontend Server in a new window
echo [2/2] Launching Frontend Vite Server on port 5173...
start "Apartment Frontend Server (Port 5173)" cmd.exe /k "cd /d \"%~dp0client\" && %NPM_CMD% run dev"

:: Give frontend 3 seconds to initialize
timeout /t 3 /nobreak >nul

:: 9. Open browser
echo.
echo Opening Application in default browser: http://localhost:5173
start http://localhost:5173

echo.
echo =====================================================================
echo    Application is now running!
echo =====================================================================
echo.
echo   Frontend URL:  http://localhost:5173
echo   Backend API:   http://localhost:5000/api/health
echo.
echo   DEMO LOGIN ACCOUNTS:
echo   - Admin:     admin@apartment.com    / admin123
echo   - Security:  security@apartment.com / security123
echo   - Resident:  john@resident.com     / resident123
echo.
echo   To STOP the application:
echo   - Double-click 'stop.bat' in this folder, OR
echo   - Close the two opened server terminal windows.
echo =====================================================================
echo.
pause
