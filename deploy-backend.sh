#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying CycleBuddy Backend to Google Cloud Run${NC}"

# Configuration
PROJECT_ID="your-gcp-project-id"
SERVICE_NAME="cyclebuddy-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}📋 Setting GCP project to $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build the Docker image
echo -e "${YELLOW}🔨 Building Docker image${NC}"
docker build -f Dockerfile.backend -t $IMAGE_NAME .

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
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "PORT=8080" \
  --set-env-vars "VITE_GEMINI_API_KEY=AIzaSyBuj4tPNhKXgSRg3RqpZEeM375PWvUfa_E" \
  --set-env-vars "VITE_GOOGLE_TTS_API_KEY=AIzaSyAI_JEjo0vOEWHYP_7UG5pSTzFg4M6BIOs" \
  --set-env-vars "JWT_SECRET=your-jwt-secret-here-min-32-chars-long" \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 100 \
  --timeout 300

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
    echo -e "${GREEN}🌐 Service URL:${NC}"
    gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi 