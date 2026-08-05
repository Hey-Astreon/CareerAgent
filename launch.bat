@echo off
title CareerAgent - AI Career Operating System
echo ========================================================
echo   CAREERAGENT - AI CAREER OPERATING SYSTEM
echo   Speed-to-Apply Remote Job Discovery ^& Application Engine
echo   Candidate Profiles: Roushan Kumar ^& Ayushi Raj
echo ========================================================
echo.

cd /d "%~dp0"
if exist "ai_career_engine" cd "ai_career_engine"

echo [1/4] Checking Node.js environment...
node -v >nul 2>&1
if %errorlevel% neq 0 goto NODE_ERROR

echo [2/4] Verifying npm dependencies...
if not exist "node_modules" goto INSTALL_NPM
goto DB_CHECK

:INSTALL_NPM
echo [AUTO-INSTALL] Installing required npm packages...
call npm install
goto DB_CHECK

:DB_CHECK
echo [3/4] Verifying database schema and candidate profiles...
if not exist "prisma\dev.db" goto SETUP_DB
goto LAUNCH_APP

:SETUP_DB
echo [DATABASE SETUP] Initializing SQLite database...
call npx prisma db push
call npx tsx prisma/seed.ts
goto LAUNCH_APP

:LAUNCH_APP
echo [4/4] Launching CareerAgent Web Dashboard at http://localhost:3000 ...
echo.
start "" "http://localhost:3000"
call npm run dev
goto END

:NODE_ERROR
echo.
echo [ERROR] Node.js is not installed or not in PATH!
echo Please install Node.js (v20+ LTS) from https://nodejs.org
echo.
pause
exit /b 1

:END
pause
