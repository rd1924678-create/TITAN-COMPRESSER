@echo off
title TITAN-COMPRESSER // GAMING EDITION v3.2
color 0B

:: Move to the folder where this bat file lives
pushd "%~dp0"

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [!] SYSTEM ALERT: Node.js runtime not detected on this system!
    echo.
    echo  Please install Node.js from: https://nodejs.org
    echo  Then re-launch this file.
    echo.
    pause
    popd
    exit /b 1
)

:: Auto-install dependencies on first run
if not exist "node_modules\" (
    echo.
    echo  ==============================================================
    echo   [INITIALIZING ENVIRONMENT] First-time setup detected...
    echo   Installing high-performance compression modules...
    echo  ==============================================================
    echo.
    call npm install
    echo.
)

:: Start the compressor
node index.js

echo.
echo  ==============================================================
echo   System idle. Press any key to terminate session...
echo  ==============================================================
pause >nul
popd
