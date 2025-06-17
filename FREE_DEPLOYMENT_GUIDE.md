# 🆓 Free Deployment Guide - CycleBuddy

**No billing required!** Deploy your CycleBuddy application for free using Vercel + Railway.

## 🎯 **Deployment Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Database     │
│   (Vercel)      │───▶│   (Railway)      │───▶│  (Railway PG)   │
│   React/Vite    │    │   Express.js     │    │  PostgreSQL     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 **Prerequisites**

1. **GitHub account** (free)
2. **Vercel account** (free) - Sign up at https://vercel.com
3. **Railway account** (free) - Sign up at https://railway.app

## 🚀 **Step 1: Deploy Backend + Database (Railway)**

### 1.1 Push Code to GitHub
```bash
# Make sure your code is committed and pushed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 1.2 Deploy to Railway

1. **Go to**: https://railway.app
2. **Sign in** with GitHub
3. **Click**: "Deploy from GitHub repo"
4. **Select**: Your `CycleBuddy` repository
5. **Choose**: Deploy from `backend` folder (or root with backend config)

### 1.3 Add Database

1. **In Railway dashboard**: Click "New" → "Database" → "PostgreSQL"
2. **Note the connection details** (Railway will provide these)

### 1.4 Set Environment Variables

In Railway project settings, add these variables:

```env
# Database (Railway will auto-populate these)
DATABASE_URL=postgresql://user:pass@host:port/database
DB_HOST=your-railway-db-host
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=auto-generated-password
DB_SSL=true

# JWT Secret
JWT_SECRET=your-super-secure-jwt-secret-here-at-least-32-characters

# AI API Keys
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_TTS_API_KEY=your-google-tts-api-key

# Port
PORT=8080
```

### 1.5 Initialize Database Tables

1. **Connect to Railway database** via their web interface
2. **Run this SQL**:

```sql
-- Create Users table for authentication
CREATE TABLE IF NOT EXISTS il_sec_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    last_name VARCHAR(255),
    mail VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    birthdate DATE,
    status INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Cycles table
CREATE TABLE IF NOT EXISTS il_app_cycles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES il_sec_users(id) ON DELETE CASCADE,
    init DATE NOT NULL,
    "end" DATE NOT NULL,
    status INTEGER DEFAULT 1,
    created_by INTEGER REFERENCES il_sec_users(id),
    updated_by INTEGER REFERENCES il_sec_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Tasks table
CREATE TABLE IF NOT EXISTS il_app_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES il_sec_users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category_id INTEGER,
    status INTEGER DEFAULT 1,
    created_by INTEGER REFERENCES il_sec_users(id),
    updated_by INTEGER REFERENCES il_sec_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cycles_user_id ON il_app_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON il_app_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON il_sec_users(mail);
```

## 🎨 **Step 2: Deploy Frontend (Vercel)**

### 2.1 Prepare Frontend Environment

Create `.env.production` file:

```env
# Backend API URL (get this from Railway after backend deployment)
VITE_API_URL=https://your-backend-production-url.railway.app

# Stellar Configuration
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# AI Configuration (same as backend)
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_GOOGLE_TTS_API_KEY=your-google-tts-api-key

# Feature Flags
VITE_ENCRYPT_HEALTH_DATA=true
VITE_SIMULATION_MODE=false
```

### 2.2 Deploy to Vercel

1. **Go to**: https://vercel.com/dashboard
2. **Click**: "New Project"
3. **Import**: Your GitHub repository
4. **Configure**:
   - Framework Preset: `Vite`
   - Root Directory: `./` (project root)
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Set Environment Variables** in Vercel dashboard (same as above)

6. **Deploy!**

## 🔗 **Step 3: Connect Frontend to Backend**

1. **Get your Railway backend URL** (e.g., `https://cyclebuddy-backend-production.railway.app`)
2. **Update VITE_API_URL** in Vercel environment variables
3. **Redeploy** frontend

## ✅ **Testing Your Deployment**

1. **Frontend URL**: `https://your-project.vercel.app`
2. **Backend URL**: `https://your-backend.railway.app`
3. **Test user registration/login**
4. **Test API endpoints**

## 🔧 **Alternative Platforms**

### Other Free Options:

**Frontend Alternatives:**
- **Netlify** (free tier, similar to Vercel)
- **Surge.sh** (simple static hosting)
- **GitHub Pages** (for static sites)

**Backend Alternatives:**
- **Render** (free tier available)
- **Heroku** (limited free tier)
- **Fly.io** (free allowance)

## 💰 **Cost Breakdown**

### Free Tier Limits:
- **Vercel**: 100GB bandwidth, unlimited personal projects
- **Railway**: $5 credit monthly (enough for small apps)
- **Total Monthly Cost**: ~$0-5 (only if you exceed Railway free credits)

## 🚨 **Important Notes**

1. **Environment Variables**: Keep API keys secure
2. **Database Backups**: Railway provides automatic backups
3. **Custom Domains**: Both platforms support custom domains (free)
4. **SSL/HTTPS**: Enabled by default on both platforms
5. **Monitoring**: Both provide basic monitoring and logs

## 🔄 **Deployment Commands (Quick Reference)**

```bash
# Deploy updates
git add .
git commit -m "Update application"
git push origin main

# Both Vercel and Railway will auto-deploy from GitHub
```

## 📞 **Support**

If you encounter issues:
1. Check the platform documentation
2. Review environment variables
3. Check deployment logs in dashboards
4. Test API endpoints individually

---

**🎉 Your CycleBuddy app will be live at:**
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-backend.railway.app`

**Total setup time**: ~15-30 minutes
**Monthly cost**: $0-5 (mostly free!) 