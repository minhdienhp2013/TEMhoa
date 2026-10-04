@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Mo-TemHoa-Windows.ps1"
if errorlevel 1 pause
