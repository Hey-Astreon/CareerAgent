@echo off
title CareerAgent - AI Career Operating System
echo ========================================================
echo   CAREERAGENT - AI CAREER OPERATING SYSTEM
echo   Speed-to-Apply Remote Job Discovery & Application Engine
echo   Candidate Profiles: Roushan Kumar & Ayushi Raj
echo ========================================================
echo.

cd /d "%~dp0"
if exist "ai_career_engine" cd "ai_career_engine"

echo [1/4] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (v20+ LTS) from https://nodejs.org
    pause
    exit /b 1
)

echo [2/4] Verifying npm dependencies...
if not exist "node_modules" (
    echo [AUTO-INSTALL] Installing required npm packages (first time setup)...
    call npm install
)

echo [3/4] Verifying database schema and candidate profiles...
if not exist "prisma\dev.db" (
    echo [DATABASE SETUP] Initializing SQLite database & seeding Roushan & Ayushi profiles...
    call npx prisma db push
    call npx tsx prisma/seed.ts
)

echo [4/4] Launching CareerAgent Web Dashboard at http://localhost:3000 ...
echo.

start "" "http://localhost:3000"

call npm run dev
