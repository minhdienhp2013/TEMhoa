@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo [TEMhoa] Đang kiểm tra phiên bản Python trên máy tính...

set PYTHON_CMD=

for %%C in ("py -3.12" "py -3.13" "py -3.11" "py -3" "python" "python3") do (
    if not defined PYTHON_CMD (
        %%~C -c "import sys; sys.exit(0 if (3,11)<=sys.version_info[:2]<(3,14) else 1)" >nul 2>&1
        if not errorlevel 1 (
            set PYTHON_CMD=%%~C
        )
    )
)

if defined PYTHON_CMD (
    echo [TEMhoa] Tìm thấy Python phù hợp: %PYTHON_CMD%
    %PYTHON_CMD% setup_background_ai.py
    if not errorlevel 1 goto done
)

echo.
echo [TEMhoa] LỖI: Chưa tìm thấy phiên bản Python phù hợp (yêu cầu Python 3.11, 3.12 hoặc 3.13).
echo Vui lòng tải và cài đặt Python 3.12 tại: https://www.python.org/downloads/
echo.
echo LƯU Ý KHI CÀI ĐẶT TRÊN WINDOWS:
echo   [x] Nhớ tích chọn ô "Add python.exe to PATH" hoặc "Use admin privileges when installing py.exe"
echo Sau khi cài đặt xong, hãy mở lại tệp Cai-AI-Windows.bat này.
echo.

:done
pause
