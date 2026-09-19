#!/bin/bash
echo "======================================================================"
echo " CLUBOPS AI - LAUNCHING LOCAL EVENT OPERATIONS COMMAND CENTER"
echo "======================================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting server on http://localhost:3000..."
npm run dev
