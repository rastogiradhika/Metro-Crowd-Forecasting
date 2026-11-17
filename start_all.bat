@echo off
title MetroAI Launcher
echo ====================================================
echo Starting MetroAI Services...
echo ====================================================
start "MetroAI Backend" cmd /k "cd /d %~dp0metroai-backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "MetroAI Frontend" cmd /k "cd /d %~dp0metroai-frontend && npm run dev"
echo.
echo Both servers have been launched in separate terminal windows:
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8000
echo - Swagger:  http://localhost:8000/docs
echo.
pause
