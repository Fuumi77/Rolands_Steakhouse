@echo off
title Roland's Steakhouse - Local Server
color 0A
echo.
echo  ============================================
echo   Roland's Steakhouse - Starting Server...
echo  ============================================
echo.

cd /d "%~dp0"

:: Force append common Node paths just in case the system hasn't restarted since install
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs"

:: Check if node is available
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo.
    echo  Please install Node from https://nodejs.org and then restart your PC.
    echo.
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo  Installing dependencies...
    call npm.cmd install
    echo.
)

:: Start the server in background via cmd
echo  Starting server...
start "Roland's Server" cmd /c "node server.js"

:: Wait for server to boot
timeout /t 3 /nobreak >nul

:: Open browser automatically
echo  Opening browser...
start "" "http://localhost:3000/index.html"

echo.
echo  ============================================
echo   Server running at: http://localhost:3000
echo   Browser opened automatically!
echo.
echo   IMPORTANT: Keep the other black window
echo   open — that is the server. Closing it
echo   will stop payments from working.
echo  ============================================
echo.
pause
