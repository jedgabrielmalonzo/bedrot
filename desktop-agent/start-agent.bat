@echo off
title DeskRemote Desktop Agent
color 0b
echo ========================================================
echo               DeskRemote Desktop Agent
echo         Wireless Desktop Remote Control System
echo ========================================================
echo.

cd /d "%~dp0"

:: Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if dist exists, otherwise build
if not exist "dist\server.js" (
    echo [INFO] Building DeskRemote Desktop Agent...
    call npm run build
)

echo [INFO] Starting DeskRemote Agent Server...
node dist\server.js
pause
