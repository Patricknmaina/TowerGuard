@echo off
setlocal

REM Auto-start backend and frontend in new terminal windows.

REM Backend server
pushd .\backend
start "TowerGuard Backend" cmd /k "cd /d %~dp0backend && if exist venv\\Scripts\\activate venv\\Scripts\\activate && uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload"
popd

REM Frontend dev server
pushd .\TowerGuard\frontend
start "TowerGuard Frontend" cmd /k "cd /d %~dp0TowerGuard\\frontend && npm run dev"
popd

endlocal
