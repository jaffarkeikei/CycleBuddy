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

### 4. Enable Required APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

## 🗄️ Database Setup (Optional)

### Option 1: Google Cloud SQL (Recommended for Production)
```bash
# Create PostgreSQL instance
gcloud sql instances create cyclebuddy-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create cyclebuddy --instance=cyclebuddy-db

# Create user
gcloud sql users create cyclebuddy-user \
  --instance=cyclebuddy-db \
  --password=your-secure-password
```

### Option 2: External Database
You can use any PostgreSQL database (like Supabase, AWS RDS, etc.)

## 🚀 Deployment Steps

### Step 1: Configure Environment Variables

1. **Update deployment scripts:**
   - Edit `deploy-backend.sh` and `deploy-frontend.sh`
   - Replace `"your-gcp-project-id"` with your actual project ID

2. **Update contract IDs (if changed):**
   - Your current contract IDs from `.env` will be used
   - Make sure they're valid for your target network

### Step 2: Deploy Backend Service

```bash
# Make script executable
chmod +x deploy-backend.sh

# Deploy backend
./deploy-backend.sh
```

The backend will be deployed with:
- ✅ Express.js API server
- ✅ Environment variables configured
- ✅ Auto-scaling enabled
- ✅ Health checks configured

### Step 3: Deploy Frontend Service

```bash
# Make script executable
chmod +x deploy-frontend.sh

# Deploy frontend (this will automatically get the backend URL)
./deploy-frontend.sh
```

The frontend will be deployed with:
- ✅ React/Vite build optimized for production
- ✅ Nginx serving static files
- ✅ Client-side routing configured
- ✅ Environment variables baked into build

## 🔐 Environment Variables Reference

### Backend Environment Variables
```bash
NODE_ENV=production
PORT=8080
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=cyclebuddy
DB_USER=cyclebuddy-user
DB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-here-min-32-chars-long
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_GOOGLE_TTS_API_KEY=your-google-tts-api-key
```

### Frontend Environment Variables (Build Time)
```bash
VITE_API_URL=https://your-backend-url
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_GOOGLE_TTS_API_KEY=your-google-tts-api-key
VITE_ENCRYPT_HEALTH_DATA=true
VITE_SIMULATION_MODE=false
```

## 🔍 Monitoring and Logs

### View Logs
```bash
# Backend logs
gcloud logs tail --service=cyclebuddy-backend

# Frontend logs  
gcloud logs tail --service=cyclebuddy-frontend
```

### Check Service Status
```bash
# List all services
gcloud run services list

# Get service details
gcloud run services describe cyclebuddy-backend --region=us-central1
gcloud run services describe cyclebuddy-frontend --region=us-central1
```

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check Docker is running
   - Verify all dependencies in package.json
   - Check for syntax errors in code

2. **Environment Variable Issues:**
   - Ensure all required env vars are set
   - Check for typos in variable names
   - Verify API keys are valid

3. **Database Connection Issues:**
   - Check database credentials
   - Verify database is accessible
   - Check Cloud SQL connection settings

4. **CORS Issues:**
   - Update backend CORS configuration
   - Ensure frontend URL is allowed

## 📊 Cost Estimation

**Minimal Usage (Development/Testing):**
- Cloud Run: ~$0-10/month (free tier covers most development usage)
- Cloud SQL (db-f1-micro): ~$7/month
- Container Registry: ~$0.10/month

**Production Usage:**
- Depends on traffic and resource usage
- Cloud Run scales to zero when not in use
- Consider upgrading database tier for production

## 🔄 Updates and Redeployment

To update your application:

1. **Code Changes:**
   ```bash
   git pull origin main
   ./deploy-backend.sh    # If backend changes
   ./deploy-frontend.sh   # If frontend changes
   ```

2. **Environment Variables:**
   ```bash
   # Update environment variables in Cloud Run console
   # Or redeploy with new variables
   ```

## 🌐 Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service cyclebuddy-frontend \
  --domain your-domain.com \
  --region us-central1
```

## 🔒 Security Considerations

1. **API Keys:** Store sensitive keys in Secret Manager
2. **Database:** Use Cloud SQL with private IP
3. **HTTPS:** Enabled by default on Cloud Run
4. **Authentication:** Implement proper JWT validation
5. **CORS:** Configure restrictive CORS policies

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Google Cloud Run documentation
3. Check application logs for specific errors
4. Verify all prerequisites are met

---

🎉 **Congratulations!** Your CycleBuddy application should now be running on Google Cloud Run! 