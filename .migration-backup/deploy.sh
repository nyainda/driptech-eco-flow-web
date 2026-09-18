#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

# Text Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting DripTech Deployment Process...${NC}"

# 0. Build the Project
echo -e "\n${BLUE}🔨 Building Project...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build Successful!${NC}"
else
    echo -e "${RED}❌ Build Failed. Aborting deployment.${NC}"
    exit 1
fi

# 1. Deploy Cloudflare Worker
echo -e "\n${BLUE}📦 Deploying Cloudflare Worker...${NC}"
cd cloudflare-worker
if npx wrangler deploy; then
    echo -e "${GREEN}✅ Cloudflare Worker Deployed Successfully!${NC}"
else
    echo -e "${RED}❌ Cloudflare Worker Deployment Failed${NC}"
    exit 1
fi
cd ..

# 2. Deploy Supabase Edge Functions
echo -e "\n${BLUE}⚡ Deploying Supabase Edge Functions...${NC}"
# Check if supabase CLI is available or use npx
if npx supabase functions deploy generate-blog-posts newsletter-subscribe; then
    echo -e "${GREEN}✅ Edge Functions Deployed Successfully!${NC}"
else
    echo -e "${RED}❌ Edge Function Deployment Failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 All Deployments Complete!${NC}"
