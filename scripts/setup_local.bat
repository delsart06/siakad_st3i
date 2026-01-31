@echo off
REM SIAKAD - Local Development Setup Script for Windows
REM Jalankan script ini untuk setup otomatis di Windows

echo ==========================================
echo   SIAKAD - Local Development Setup
echo ==========================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Python not found. Please install Python 3.9+
    pause
    exit /b 1
)
echo [OK] Python found

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)
echo [OK] Node.js found

echo.
echo ==========================================
echo   Setting up Backend...
echo ==========================================
echo.

cd backend

REM Create virtual environment
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt -q
echo [OK] Python dependencies installed

REM Check/create .env file
if not exist ".env" (
    echo Creating backend .env file...
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=siakad
        echo JWT_SECRET=siakad-secret-key-2024-secure
        echo CORS_ORIGINS=http://localhost:3000
    ) > .env
    echo [OK] Backend .env file created
) else (
    echo [OK] Backend .env file already exists
)

cd ..

echo.
echo ==========================================
echo   Setting up Frontend...
echo ==========================================
echo.

cd frontend

REM Install dependencies
echo Installing Node.js dependencies (this may take a while)...
call npm install --silent
echo [OK] Node.js dependencies installed

REM Check/create .env file
if not exist ".env" (
    echo Creating frontend .env file...
    echo REACT_APP_BACKEND_URL=http://localhost:8001 > .env
    echo [OK] Frontend .env file created
) else (
    echo [OK] Frontend .env file already exists
)

cd ..

echo.
echo ==========================================
echo   Setup Complete!
echo ==========================================
echo.
echo To start the application:
echo.
echo 1. Start MongoDB (make sure MongoDB is running)
echo.
echo 2. Start Backend (Terminal 1):
echo    cd backend
echo    venv\Scripts\activate
echo    uvicorn server:app --host 0.0.0.0 --port 8001 --reload
echo.
echo 3. Start Frontend (Terminal 2):
echo    cd frontend
echo    npm start
echo.
echo 4. Open browser:
echo    Frontend: http://localhost:3000
echo    API Docs: http://localhost:8001/docs
echo.
echo Default accounts:
echo    Admin: admin@siakad.ac.id / admin123
echo    Mahasiswa: midel@siakad.ac.id / password
echo    Dosen PA: ahmad.pa@dosen.ac.id / password
echo.
pause
