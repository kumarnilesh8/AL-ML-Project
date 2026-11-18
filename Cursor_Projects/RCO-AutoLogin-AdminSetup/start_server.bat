@echo off
REM Batch file to start the RCO Auto Login Web Server

echo ============================================================
echo RCO Auto Login - Web Server Launcher
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7 or higher from https://www.python.org/
    pause
    exit /b 1
)

echo Python detected: 
python --version
echo.

REM Check if dependencies are installed
echo Checking dependencies...
pip show Flask >nul 2>&1
if errorlevel 1 (
    echo.
    echo Flask is not installed. Installing dependencies...
    echo.
    pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Dependencies OK
)

echo.
echo Starting Flask web server...
echo.
echo ============================================================
echo.

REM Start the Flask server
python app.py

REM If the server stops, pause so user can see any errors
pause

