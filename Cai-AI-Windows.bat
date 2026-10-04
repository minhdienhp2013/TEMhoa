@echo off
cd /d "%~dp0"
py -3.12 setup_background_ai.py
if not errorlevel 1 goto done
echo Neu chua co Python, hay cai Python 3.12 tu https://www.python.org/downloads/
echo Sau do mo lai tep Cai-AI-Windows.bat.
:done
pause
