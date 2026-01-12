#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Memory Weaver Project Setup ===${NC}\n"

# 1. Check for .env.local and create from template if missing
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating .env.local from template...${NC}"
    cp .env.local.template .env.local
    echo -e "${GREEN}✓ .env.local created.${NC}"
else
    echo -e "${BLUE}ℹ .env.local already exists. Skipping copy.${NC}"
fi

# 2. Install Dependencies
echo -e "\n${YELLOW}Installing project dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully.${NC}"
else
    echo -e "\033[0;31m❌ Dependency installation failed. Check your internet connection or Node version.\033[0m"
    exit 1
fi

# 3. Final Instructions
echo -e "\n${BLUE}=====================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "1. Open ${BLUE}.env.local${NC} and fill in your API keys."
echo -e "2. Get Firebase keys: ${BLUE}https://console.firebase.google.com/${NC}"
echo -e "3. Get Resend keys:   ${BLUE}https://resend.com/dashboard${NC}"
echo -e "4. Run the app:       ${GREEN}npm run dev${NC}"
echo -e "${BLUE}=====================================${NC}"
