@echo off
title MetroAI Frontend (Port 5173)
cd /d "%~dp0metroai-frontend"
echo ====================================================
echo Starting MetroAI Frontend on http://localhost:5173
echo ====================================================
npm run dev
pause
