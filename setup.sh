#!/bin/bash

# DripTech EcoFlow - Developer Setup Script

# Text Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting DripTech EcoFlow Setup...${NC}"

# 1. Check for Prerequisites
echo -e "\n${YELLOW}📦 Checking Prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js (v18+) first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found: $(node -v)${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git found: $(git --version)${NC}"

# 2. Install Dependencies
echo -e "\n${YELLOW}📥 Installing Dependencies...${NC}"
if [ -f "bun.lockb" ] || command -v bun &> /dev/null; then
     echo "Using Bun for installation..."
     bun install
else
     echo "Using npm for installation..."
     npm install
fi

# 3. Environment Setup
echo -e "\n${YELLOW}⚙️  Setting up Environment...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please update .env with your actual keys!${NC}"
    else
        echo -e "${RED}❌ .env.example not found!${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# 4. Supabase Setup Check
echo -e "\n${YELLOW}🔥 Checking Supabase...${NC}"
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅ Supabase CLI found${NC}"
    # check if logged in (optional, might require interaction)
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Install it to manage backend: npm install -g supabase${NC}"
fi

echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
echo -e "run '${YELLOW}npm run dev${NC}' to start the server."
