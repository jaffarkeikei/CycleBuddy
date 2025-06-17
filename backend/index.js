const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // <--- ADD THIS
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const router = express.Router();

const setupSecurityRoutes = require('./features/security');
const setupCycleRoutes = require('./features/cycle');
const setupProductivityRoutes = require('./features/productivity');

// --- CORS middleware ---
// Allow React frontend to talk to backend
/* app.use(cors({
  origin: 'http://localhost:3000', // Allow frontend origin
  credentials: true,              // Allow cookies, auth headers, etc (if used)
})); */
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'jaffars',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cyclebuddy',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10, // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database tables
async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database tables...');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS il_sec_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        mail VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        birthdate DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create cycles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS il_app_cycles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES il_sec_users(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE,
        cycle_length INTEGER,
        period_length INTEGER,
        notes TEXT,
        symptoms JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS il_app_tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES il_sec_users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        due_date DATE,
        completed BOOLEAN DEFAULT FALSE,
        priority VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_cycles_user_id ON il_app_cycles(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON il_app_tasks(user_id)`);

    console.log('✅ Database tables initialized successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// Initialize database on startup
initializeDatabase();

// Register the security routes
app.use('/api', setupSecurityRoutes(pool));
app.use('/api', setupCycleRoutes(pool));
app.use('/api', setupProductivityRoutes(pool));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});