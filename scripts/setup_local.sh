#!/bin/bash

# ==================================================
# SIAKAD Local Development Setup Script
# ==================================================

set -e

echo "=================================================="
echo "   SIAKAD - Setup Local Development"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    echo -e "${GREEN}✓${NC} Python: $PYTHON_VERSION"
else
    echo -e "${RED}✗${NC} Python 3 not found. Please install Python 3.9+"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check MongoDB
if command -v mongod &> /dev/null || pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB available"
else
    echo -e "${YELLOW}!${NC} MongoDB not found in PATH. Make sure it's running."
fi

echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# ==================================================
# Setup Backend
# ==================================================
echo "Setting up Backend..."

cd backend

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "  Installing Python dependencies..."
pip install -q -r requirements.txt

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "  Creating backend/.env..."
    cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=siakad
JWT_SECRET=siakad-secret-key-2024-secure
CORS_ORIGINS=http://localhost:3000
EOF
fi

# Create uploads directory
mkdir -p uploads/biodata uploads/foto_profil

echo -e "${GREEN}✓${NC} Backend setup complete"

cd ..

# ==================================================
# Setup Frontend
# ==================================================
echo ""
echo "Setting up Frontend..."

cd frontend

# Install dependencies
if [ -f "yarn.lock" ]; then
    echo "  Installing Node dependencies with yarn..."
    yarn install --silent
else
    echo "  Installing Node dependencies with npm..."
    npm install --silent
fi

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "  Creating frontend/.env..."
    cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
fi

echo -e "${GREEN}✓${NC} Frontend setup complete"

cd ..

# ==================================================
# Seed Database
# ==================================================
echo ""
echo "Seeding database..."

cd backend
source venv/bin/activate
python ../scripts/seed_data.py

cd ..

# ==================================================
# Done
# ==================================================
echo ""
echo "=================================================="
echo -e "${GREEN}   SETUP COMPLETE!${NC}"
echo "=================================================="
echo ""
echo "To start the application:"
echo ""
echo "  ${YELLOW}Terminal 1 (Backend):${NC}"
echo "    cd backend"
echo "    source venv/bin/activate"
echo "    uvicorn server:app --host 0.0.0.0 --port 8001 --reload"
echo ""
echo "  ${YELLOW}Terminal 2 (Frontend):${NC}"
echo "    cd frontend"
echo "    yarn start  # atau npm start"
echo ""
echo "Then open:"
echo "  - Frontend: http://localhost:3000"
echo "  - API Docs: http://localhost:8001/docs"
echo ""
echo "Login dengan:"
echo "  - Admin: NIP 1234567890 / admin123"
echo "  - Mahasiswa: NIM 2024001 / password"
echo ""
echo "=================================================="
