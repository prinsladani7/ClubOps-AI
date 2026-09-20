#!/usr/bin/env bash

# Color definitions
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}  CLUBOPS AI - BIT N BUILD HACKATHON 2026 COMMAND CENTER${NC}"
echo -e "${CYAN}  Multi-Tenant AI Operating System for Campus Hackathons & Events${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo ""

# [1/4] Check Node.js and npm
echo -e "${GREEN}[1/4] Checking Node.js & npm runtime...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed or not found in PATH!${NC}"
    echo "Please install Node.js (version 18 or newer) from: https://nodejs.org"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed!${NC}"
    exit 1
fi

NODE_VER=$(node -v)
echo -e "  ${GREEN}✓${NC} Node.js detected: ${NODE_VER}"

# [2/4] Setup environment file
echo -e "${GREEN}[2/4] Verifying local environment configuration...${NC}"
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        echo -e "  ${YELLOW}→${NC} Creating .env.local from .env.example..."
        cp .env.example .env.local
    else
        echo "PORT=3000" > .env.local
        echo 'NEXT_PUBLIC_APP_NAME="ClubOps AI"' >> .env.local
    fi
fi
echo -e "  ${GREEN}✓${NC} Environment configuration ready."

# [3/4] Dependencies check
echo -e "${GREEN}[3/4] Verifying dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "  ${YELLOW}→${NC} node_modules not found. Running npm install (please wait)..."
    npm install
fi
echo -e "  ${GREEN}✓${NC} Dependencies verified."

# [4/4] Launch Application & Browser
echo -e "${GREEN}[4/4] Starting ClubOps AI Operations Hub on http://localhost:3000 ...${NC}"
echo ""
echo -e "${CYAN}======================================================================${NC}"
echo -e "  OPERATIONAL MODULES ACTIVE:"
echo -e "   * Live War Room: http://localhost:3000/war-room"
echo -e "   * 36h Run-of-Show: http://localhost:3000/planning"
echo -e "   * Algorithm Intelligence: http://localhost:3000/algorithms"
echo -e "   * Fast Persona Switcher in Header"
echo -e "${CYAN}======================================================================${NC}"
echo ""
echo -e "Server starting... opening browser in 3 seconds."
echo -e "Press ${YELLOW}Ctrl+C${NC} to stop the server at any time."
echo ""

# Background browser opener function with cross-platform OS detection
(
  sleep 3
  URL="http://localhost:3000"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$URL" 2>/dev/null || true
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux (Desktop) or WSL
    if grep -qEi "(Microsoft|WSL)" /proc/version 2>/dev/null; then
      cmd.exe /c start "$URL" 2>/dev/null || wslview "$URL" 2>/dev/null || true
    elif command -v xdg-open &> /dev/null; then
      xdg-open "$URL" 2>/dev/null || true
    fi
  fi
) &

npm run dev
