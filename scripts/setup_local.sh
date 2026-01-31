#!/bin/bash

# SIAKAD - Local Development Setup Script
# Jalankan script ini untuk setup otomatis di Linux/Mac

echo "=========================================="
echo "  SIAKAD - Local Development Setup"
echo "=========================================="
echo ""

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function untuk print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    print_status "Python $PYTHON_VERSION found"
else
    print_error "Python 3 not found. Please install Python 3.9+"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js $NODE_VERSION found"
else
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check MongoDB
if command -v mongod &> /dev/null; then
    print_status "MongoDB found"
else
    print_warning "MongoDB not found locally. Make sure you have MongoDB running (local or Atlas)"
fi

echo ""
echo "=========================================="
echo "  Setting up Backend..."
echo "=========================================="
echo ""

cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    print_status "Virtual environment created"
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate
print_status "Virtual environment activated"

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt --quiet
print_status "Python dependencies installed"

# Check/create .env file
if [ ! -f ".env" ]; then
    echo "Creating backend .env file..."
    cat > .env << EOL
MONGO_URL=mongodb://localhost:27017
DB_NAME=siakad
JWT_SECRET=siakad-secret-key-2024-secure
CORS_ORIGINS=http://localhost:3000
EOL
    print_status "Backend .env file created"
else
    print_status "Backend .env file already exists"
fi

cd ..

echo ""
echo "=========================================="
echo "  Setting up Frontend..."
echo "=========================================="
echo ""

cd frontend

# Install dependencies
echo "Installing Node.js dependencies (this may take a while)..."
if command -v yarn &> /dev/null; then
    yarn install --silent
else
    npm install --silent
fi
print_status "Node.js dependencies installed"

# Check/create .env file
if [ ! -f ".env" ]; then
    echo "Creating frontend .env file..."
    cat > .env << EOL
REACT_APP_BACKEND_URL=http://localhost:8001
EOL
    print_status "Frontend .env file created"
else
    print_status "Frontend .env file already exists"
fi

cd ..

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start MongoDB:"
echo "   ${YELLOW}mongod${NC} atau ${YELLOW}sudo systemctl start mongod${NC}"
echo ""
echo "2. Start Backend (Terminal 1):"
echo "   ${YELLOW}cd backend${NC}"
echo "   ${YELLOW}source venv/bin/activate${NC}"
echo "   ${YELLOW}uvicorn server:app --host 0.0.0.0 --port 8001 --reload${NC}"
echo ""
echo "3. Start Frontend (Terminal 2):"
echo "   ${YELLOW}cd frontend${NC}"
echo "   ${YELLOW}yarn start${NC} atau ${YELLOW}npm start${NC}"
echo ""
echo "4. Open browser:"
echo "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo "   API Docs: ${GREEN}http://localhost:8001/docs${NC}"
echo ""
echo "Default accounts:"
echo "   Admin: admin@siakad.ac.id / admin123"
echo "   Mahasiswa: midel@siakad.ac.id / password"
echo "   Dosen PA: ahmad.pa@dosen.ac.id / password"
echo ""
