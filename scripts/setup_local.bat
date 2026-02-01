@echo off
REM ==================================================
REM SIAKAD Local Development Setup Script (Windows)
REM ==================================================

echo ==================================================
echo    SIAKAD - Setup Local Development
echo ==================================================
echo.

REM Check prerequisites
echo Checking prerequisites...

REM Check Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [X] Python not found. Please install Python 3.9+
    pause
    exit /b 1
)
echo [OK] Python found

REM Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)
echo [OK] Node.js found

echo.

REM Get script directory
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..

cd /d %PROJECT_DIR%

REM ==================================================
REM Setup Backend
REM ==================================================
echo Setting up Backend...

cd backend

REM Create virtual environment if not exists
if not exist "venv" (
    echo   Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo   Installing Python dependencies...
pip install -q -r requirements.txt

REM Create .env if not exists
if not exist ".env" (
    echo   Creating backend\.env...
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=siakad
        echo JWT_SECRET=siakad-secret-key-2024-secure
        echo CORS_ORIGINS=http://localhost:3000
    ) > .env
)

REM Create uploads directory
if not exist "uploads\biodata" mkdir uploads\biodata
if not exist "uploads\foto_profil" mkdir uploads\foto_profil

echo [OK] Backend setup complete

cd ..

REM ==================================================
REM Setup Frontend
REM ==================================================
echo.
echo Setting up Frontend...

cd frontend

REM Install dependencies
if exist "yarn.lock" (
    echo   Installing Node dependencies with yarn...
    call yarn install
) else (
    echo   Installing Node dependencies with npm...
    call npm install
)

REM Create .env if not exists
if not exist ".env" (
    echo   Creating frontend\.env...
    echo REACT_APP_BACKEND_URL=http://localhost:8001 > .env
)

echo [OK] Frontend setup complete

cd ..

REM ==================================================
REM Seed Database
REM ==================================================
echo.
echo Seeding database...

cd backend
call venv\Scripts\activate.bat
python ..\scripts\seed_data.py

cd ..

REM ==================================================
REM Done
REM ==================================================
echo.
echo ==================================================
echo    SETUP COMPLETE!
echo ==================================================
echo.
echo To start the application:
echo.
echo   Terminal 1 (Backend):
echo     cd backend
echo     venv\Scripts\activate
echo     uvicorn server:app --host 0.0.0.0 --port 8001 --reload
echo.
echo   Terminal 2 (Frontend):
echo     cd frontend
echo     yarn start  (atau npm start)
echo.
echo Then open:
echo   - Frontend: http://localhost:3000
echo   - API Docs: http://localhost:8001/docs
echo.
echo Login dengan:
echo   - Admin: NIP 1234567890 / admin123
echo   - Mahasiswa: NIM 2024001 / password
echo.
echo ==================================================
echo.
pause
