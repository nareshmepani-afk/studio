@echo off
TITLE Cinematic Studio - Startup Sequence
echo ===================================================
echo   CINEMATIC STUDIO : AUTOMATED STARTUP SEQUENCE
echo ===================================================
echo.
echo [1/3] Initializing Theatrical Environment...
cd /d "%~dp0"

echo [2/3] Activating HTTPS and Starting Modality Nexus...
echo.
echo (Press Ctrl+C to stop the studio at any time)
echo.

:: Open the studio in the default browser after a short delay
start https://localhost:3000/studio

:: Start the dev server (using npm.cmd for Windows compatibility)
call npm.cmd run dev

pause
