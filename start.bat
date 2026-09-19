@echo off
title ClubOps AI - The AI Operating System for College Club Events
cls
echo ======================================================================
echo  CLUBOPS AI - LAUNCHING LOCAL EVENT OPERATIONS COMMAND CENTER
echo ======================================================================
echo.
echo [1/3] Checking environment dependencies...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in PATH!
    pause
    exit /b 1
)

echo [2/3] Verifying dependencies...
if not exist "node_modules\" (
    echo node_modules not found. Running npm install...
    call npm install
)

echo [3/3] Launching ClubOps AI Command Center on http://localhost:3000 ...
echo.
echo ======================================================================
echo  ACTIVE OPERATIONAL MODULES:
echo   - Command Center Dashboard (Live Health & AI Attention Feed)
echo   - Task & Dependency Engine (Kanban, Table, Critical Path Graph)
echo   - Volunteer Workload Intelligence & AI Assignment Assistant
echo   - Meeting Intelligence (Transcript Parsing & Action Extraction)
echo   - Permission-Aware RAG Knowledge Base (Grounded Citations)
echo   - Risk Intelligence Matrix (Why, Evidence, Impact, What to do)
echo   - AI Assistant Copilot (Typed Tools & Action Approval Cards)
echo   - Immutable Security Audit Log & Compliance Ledger
echo   - Multi-Tenant RBAC (Admin, Organizer, Volunteer, Member)
echo ======================================================================
echo.
echo Opening Google Chrome automatically...
echo Server starting at http://localhost:3000
echo Press Ctrl+C in this terminal at any time to stop the server.
echo.

:: Automatically open Google Chrome (or system default browser fallback) once server is up
start /b "" cmd /c "timeout /t 3 /nobreak >nul && (if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" http://localhost:3000) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" http://localhost:3000) else (start http://localhost:3000))"

npm run dev
