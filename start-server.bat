@echo off
title AeroVox Local Server
echo ===================================================
echo AeroVox - Local Web Server
echo ===================================================
echo.
echo Browsers restrict microphone access when opening files directly (file://).
echo Running a local server enables the required secure context (http://localhost).
echo.

:: Try Python 3
python -m http.server 8000 2>nul
if %ERRORLEVEL% equ 0 goto end

:: Try Python 2
python -m SimpleHTTPServer 8000 2>nul
if %ERRORLEVEL% equ 0 goto end

:: Try Node/npx
call npx -y http-server -p 8000 2>nul
if %ERRORLEVEL% equ 0 goto end

:: Try PowerShell fallback (zero-dependency on Windows)
echo Python/Node not found. Launching PowerShell server...
powershell -ExecutionPolicy Bypass -File server.ps1
if %ERRORLEVEL% equ 0 goto end

echo.
echo ERROR: Could not start server. Please ensure Python, Node.js, or PowerShell is available.
echo.
pause

:end
