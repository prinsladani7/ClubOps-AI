@echo off
setlocal enabledelayedexpansion
title ClubOps AI - Bit N Build Hackathon 2026 Operations
cls

:: Ensure script always executes in its own project directory
cd /d "%~dp0"

echo ======================================================================
echo   CLUBOPS AI - BIT N BUILD HACKATHON 2026 COMMAND CENTER
echo   Automated Event Operations and Multi-Tenant Intelligent Workspace
echo ======================================================================
echo.

:: [1/4] Environment Pre-flight Checks
echo [1/4] Checking Node.js and npm runtime...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js 18+ from https://nodejs.org
    echo Once installed, double-click this file again.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] npm package manager is not found!
    echo Please ensure Node.js and npm are added to your PATH environment variable.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo   [OK] Node.js runtime detected: !NODE_VERSION!

:: [2/4] Setup Environment Config
echo [2/4] Verifying local environment configuration...
if not exist ".env.local" (
    if exist ".env.example" (
        echo   Creating .env.local from .env.example template...
        copy .env.example .env.local >nul
    ) else (
        echo PORT=3000 > .env.local
        echo NEXT_PUBLIC_APP_NAME="ClubOps AI" >> .env.local
    )
)
echo   [OK] Environment configuration verified.

:: [3/4] Verify Dependencies
echo [3/4] Checking dependencies...
if not exist "node_modules\" (
    echo   Dependencies not installed. Running npm install, please wait...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] npm install encountered an issue.
        pause
        exit /b 1
    )
)
echo   [OK] Dependencies ready.

:: [4/4] Launch Server and Browser
echo [4/4] Starting ClubOps AI Operations Hub on http://localhost:3000 ...
echo.
echo ======================================================================
echo   ACTIVE OPERATIONAL MODULES:
echo    * Live War Room: http://localhost:3000/war-room
echo    * 36-Hour Run-of-Show Master Planner: http://localhost:3000/planning
echo    * Algorithmic Intelligence: http://localhost:3000/algorithms
echo    * Fast 1-Click Persona Switcher in Header
echo ======================================================================
echo.
echo Opening browser automatically in 3 seconds...
echo Server running at: http://localhost:3000
echo Press Ctrl+C in this window at any time to shut down the server.
echo.

:: Automatically open browser (Chrome preferred, default browser fallback)
start /b "" powershell -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; if (Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe') { Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' 'http://localhost:3000' } elseif (Test-Path 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe') { Start-Process 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' 'http://localhost:3000' } elseif (Test-Path \"$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe\") { Start-Process \"$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe\" 'http://localhost:3000' } else { Start-Process 'http://localhost:3000' }"

call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTICE] Server process exited with code %ERRORLEVEL%.
    pause
)
