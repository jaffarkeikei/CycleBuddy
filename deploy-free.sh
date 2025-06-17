#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🆓 CycleBuddy Free Deployment Setup${NC}"
echo -e "${BLUE}====================================${NC}"

# Check if git repo is clean
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes. Committing them now...${NC}"
    git add .
    git commit -m "Prepare for deployment"
    echo -e "${GREEN}✅ Changes committed${NC}"
fi

# Push to GitHub
echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code pushed to GitHub successfully${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Your code is now ready for deployment!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. 🚂 Deploy Backend to Railway:"
echo -e "   • Go to https://railway.app"
echo -e "   • Sign in with GitHub"
echo -e "   • Deploy from your repository"
echo -e "   • Add PostgreSQL database"
echo -e "   • Set environment variables (see FREE_DEPLOYMENT_GUIDE.md)"
echo ""
echo -e "2. ⚡ Deploy Frontend to Vercel:"
echo -e "   • Go to https://vercel.com/dashboard"
echo -e "   • Import your GitHub repository"
echo -e "   • Set VITE_API_URL to your Railway backend URL"
echo -e "   • Deploy!"
echo ""
echo -e "3. 📖 Full instructions available in:"
echo -e "   ${YELLOW}FREE_DEPLOYMENT_GUIDE.md${NC}"
echo ""
echo -e "${GREEN}Total deployment time: ~15-30 minutes${NC}"
echo -e "${GREEN}Monthly cost: $0-5 (mostly free!)${NC}" 