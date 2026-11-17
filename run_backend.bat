@echo off
title MetroAI Backend (Port 8000)
cd /d "%~dp0metroai-backend"
echo ====================================================
echo Starting MetroAI Backend on http://localhost:8000
echo Database: SQLite (local metroai.db)
echo ML Inference: CPU Mode (0 MB GPU VRAM required)
echo ====================================================
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
