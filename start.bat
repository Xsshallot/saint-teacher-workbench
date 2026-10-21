@echo off
rem SAINT teacher workbench launcher (double-click to start)
cd /d "%~dp0"
start "SAINT Workbench" /min node server/src/app.js
timeout /t 2 >nul
start http://localhost:8787
