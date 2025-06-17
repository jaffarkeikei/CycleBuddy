# 🚀 CycleBuddy Google Cloud Run Deployment Guide

This guide will help you deploy your CycleBuddy application to Google Cloud Run with both frontend and backend services.

## 📋 Prerequisites

### 1. Google Cloud Setup
- Google Cloud account with billing enabled
- Google Cloud project created
- Google Cloud CLI installed and authenticated

### 2. Local Requirements
- Docker installed and running
- Git repository access
- Node.js 18+ (for local testing)

## 🔧 Initial Setup

### 1. Install Google Cloud CLI
```bash
# macOS
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### 2. Authenticate with Google Cloud
```bash
gcloud auth login
gcloud auth configure-docker
```

### 3. Set Your Project ID
```bash
# Replace with your actual project ID
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID
```

## 🛠️ Quick Setup Script

Run the setup script to configure your Google Cloud project:

```bash
./setup-gcp.sh
```

This will:
- Enable required APIs (Cloud Build, Cloud Run, Cloud SQL)
- Create necessary service accounts
- Set up proper permissions

## 🗄️ Database Setup on Google Cloud

### Option 1: Cloud SQL (Recommended for Production)

```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create cyclebuddy-db \
    --database-version=POSTGRES_15 \
    --cpu=1 \
    --memory=3840MB \
    --region=us-central1 \
    --root-password=your-secure-password

# Create the database
gcloud sql databases create cyclebuddy --instance=cyclebuddy-db

# Create a user
gcloud sql users create cyclebuddy-user \
    --instance=cyclebuddy-db \
    --password=your-secure-password
```

### Option 2: External Database
If you prefer using an external PostgreSQL service like:
- AWS RDS
- DigitalOcean Managed Databases  
- ElephantSQL
- Supabase

Simply get the connection details and update the environment variables.

## 🚀 Deployment Steps

### Step 1: Deploy the Backend

```bash
# Set your environment variables
export PROJECT_ID="your-gcp-project-id"
export DB_HOST="your-db-host"
export DB_NAME="cyclebuddy"
export DB_USER="your-db-user"
export DB_PASSWORD="your-db-password"

# Run the backend deployment script
./deploy-backend.sh
```

### Step 2: Deploy the Frontend

```bash
# The script will automatically get the backend URL
./deploy-frontend.sh
```

## 🔐 Environment Variables

### Backend Environment Variables

Create a `.env.production` file or set these in Cloud Run:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@host:5432/cyclebuddy"
DB_HOST="your-db-host"
DB_PORT=5432
DB_NAME="cyclebuddy"
DB_USER="your-db-user"
DB_PASSWORD="your-db-password"
DB_SSL=true

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret"

# Google Cloud Configuration
PORT=8080

# API Keys
GEMINI_API_KEY="your-gemini-api-key"
GOOGLE_TTS_API_KEY="your-google-tts-api-key"
```

### Frontend Environment Variables

```env
# API Configuration
VITE_API_URL="https://cyclebuddy-backend-[hash]-uc.a.run.app"

# Stellar Configuration
VITE_SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# AI Configuration
VITE_GEMINI_API_KEY="your-gemini-api-key"
VITE_GOOGLE_TTS_API_KEY="your-google-tts-api-key"

# Feature Flags
VITE_ENCRYPT_HEALTH_DATA=true
VITE_SIMULATION_MODE=false
```

## 📁 Project Structure

After deployment, your Cloud Run services will be:

```
Google Cloud Project
├── cyclebuddy-backend (Cloud Run Service)
│   ├── Port: 8080
│   ├── Database: Cloud SQL PostgreSQL
│   └── APIs: Express.js REST API
├── cyclebuddy-frontend (Cloud Run Service)
│   ├── Port: 8080
│   ├── Served by: Nginx
│   └── Type: React SPA
└── cyclebuddy-db (Cloud SQL Instance)
    └── Database: PostgreSQL 15
```

## 🔧 Manual Deployment Commands

### Backend Deployment
```bash
# Build and deploy backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/cyclebuddy-backend \
    --file=Dockerfile.backend .

gcloud run deploy cyclebuddy-backend \
    --image gcr.io/$PROJECT_ID/cyclebuddy-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars="DATABASE_URL=postgresql://user:pass@host:5432/cyclebuddy,JWT_SECRET=your-secret"
```

### Frontend Deployment
```bash
# Build and deploy frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/cyclebuddy-frontend \
    --file=Dockerfile.frontend \
    --build-arg VITE_API_URL="https://your-backend-url" .

gcloud run deploy cyclebuddy-frontend \
    --image gcr.io/$PROJECT_ID/cyclebuddy-frontend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080
```

## 🔍 Monitoring and Logs

### View Logs
```bash
# Backend logs
gcloud logs tail --follow --resource-type cloud_run_revision \
    --filter "resource.labels.service_name=cyclebuddy-backend"

# Frontend logs  
gcloud logs tail --follow --resource-type cloud_run_revision \
    --filter "resource.labels.service_name=cyclebuddy-frontend"
```

### Monitor Performance
- Google Cloud Console → Cloud Run → Select Service
- Check metrics for CPU, Memory, Request count, and Response times

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if Cloud SQL instance is running
   - Verify connection string format
   - Ensure Cloud SQL Admin API is enabled

2. **Build Failures**
   - Check Dockerfile syntax
   - Verify all dependencies are listed in package.json
   - Ensure Docker context includes all required files

3. **Service Not Accessible**
   - Verify `--allow-unauthenticated` flag was used
   - Check firewall rules
   - Ensure correct port configuration

### Debug Commands
```bash
# Check service status
gcloud run services list

# Get service details
gcloud run services describe cyclebuddy-backend --region us-central1

# Check recent deployments
gcloud run revisions list --service cyclebuddy-backend --region us-central1
```

## 💰 Cost Optimization

1. **Set CPU allocation to minimum** (0.25 vCPU for low traffic)
2. **Configure autoscaling** (min instances: 0, max: 10)
3. **Use Cloud Build caching** for faster builds
4. **Monitor usage** through Cloud Console billing section

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **IAM Permissions**: Use principle of least privilege
3. **Database Security**: Use SSL connections
4. **API Keys**: Rotate keys regularly
5. **CORS Configuration**: Restrict to your domain only

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Google Cloud Run documentation
3. Check Cloud Build logs for build failures
4. Verify environment variables are set correctly

---

**Deployment URLs:** After successful deployment, you'll receive URLs like:
- Backend: `https://cyclebuddy-backend-[hash]-uc.a.run.app`
- Frontend: `https://cyclebuddy-frontend-[hash]-uc.a.run.app`

Your CycleBuddy application will be live and accessible globally! 🌍 