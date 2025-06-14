#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying CycleBuddy Frontend to Google Cloud Run${NC}"

# Configuration
PROJECT_ID="your-gcp-project-id"
SERVICE_NAME="cyclebuddy-frontend"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
BACKEND_URL="https://cyclebuddy-backend-[RANDOM-HASH]-uc.a.run.app"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Get backend URL if deployed
echo -e "${YELLOW}🔍 Getting backend service URL${NC}"
BACKEND_SERVICE_URL=$(gcloud run services describe cyclebuddy-backend --region $REGION --format 'value(status.url)' 2>/dev/null)
if [ -n "$BACKEND_SERVICE_URL" ]; then
    BACKEND_URL=$BACKEND_SERVICE_URL
    echo -e "${GREEN}📡 Backend URL found: $BACKEND_URL${NC}"
else
    echo -e "${YELLOW}⚠️  Using placeholder backend URL. Deploy backend first for best results.${NC}"
fi

# Set the project
echo -e "${YELLOW}📋 Setting GCP project to $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Build the Docker image
echo -e "${YELLOW}🔨 Building Docker image with production environment${NC}"
docker build -f Dockerfile.frontend \
  --build-arg VITE_API_URL=$BACKEND_URL \
  --build-arg VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org \
  --build-arg VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015" \
  --build-arg VITE_GEMINI_API_KEY=AIzaSyBuj4tPNhKXgSRg3RqpZEeM375PWvUfa_E \
  --build-arg VITE_GOOGLE_TTS_API_KEY=AIzaSyAI_JEjo0vOEWHYP_7UG5pSTzFg4M6BIOs \
  --build-arg VITE_ENCRYPT_HEALTH_DATA=true \
  --build-arg VITE_SIMULATION_MODE=false \
  -t $IMAGE_NAME .

# Push the image to Google Container Registry
echo -e "${YELLOW}📤 Pushing image to Container Registry${NC}"
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run${NC}"
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu-boost \
  --concurrency 1000 \
  --timeout 300

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
    echo -e "${GREEN}🌐 Service URL:${NC}"
    FRONTEND_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
    echo $FRONTEND_URL
    echo -e "${GREEN}🎉 Your CycleBuddy app is live at: $FRONTEND_URL${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi 