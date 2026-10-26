# Apartment Management PowerShell Launcher
Set-Location $PSScriptRoot

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   Apartment Visitor and Maintenance Management System Launcher" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

# 1. Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not found in system PATH! Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    pause
    exit 1
}

$npmCmd = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { "npm.cmd" } else { "npm" }

# 2. Check server/.env
if (-not (Test-Path "$PSScriptRoot\server\.env")) {
    Write-Host "[INFO] Generating default server\.env..." -ForegroundColor Yellow
    @"
PORT=5000
JWT_SECRET=apartment_management_secret_key_college_project_2026
NODE_ENV=development
"@ | Set-Content "$PSScriptRoot\server\.env"
}

# 3. Check dependencies
if (-not (Test-Path "$PSScriptRoot\server\node_modules")) {
    Write-Host "[INFO] Installing server dependencies..." -ForegroundColor Yellow
    Push-Location "$PSScriptRoot\server"
    & $npmCmd install
    Pop-Location
}

if (-not (Test-Path "$PSScriptRoot\client\node_modules")) {
    Write-Host "[INFO] Installing client dependencies..." -ForegroundColor Yellow
    Push-Location "$PSScriptRoot\client"
    & $npmCmd install
    Pop-Location
}

# 4. Start Backend Server
Write-Host "[1/2] Launching Backend Server on port 5000..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$PSScriptRoot\server`" && $npmCmd start"

Start-Sleep -Seconds 2

# 5. Start Frontend Server
Write-Host "[2/2] Launching Frontend Server on port 5173..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$PSScriptRoot\client`" && $npmCmd run dev"

Start-Sleep -Seconds 3

# 6. Open in Browser
Start-Process "http://localhost:5173"

Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "   Application is running!" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000/api/health" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "To stop servers, run .\stop.ps1 or double-click stop.bat`n" -ForegroundColor Yellow
