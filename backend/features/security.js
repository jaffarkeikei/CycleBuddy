const express = require('express');
const router = express.Router();
const { authenticateUser, generateToken, formatUserResponse } = require('../middlewares/auth');

function setupSecurityRoutes(pool) {
  // User creation route
  router.post('/user', async (req, res) => {
    try {
      const { username, name, last_name, mail, password, birthdate } = req.body;
      
      // Validate required fields
      if (!username || !mail || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }
      
      // Prepare parameters, using null for any undefined values
      const params = [
        username || null,
        name || null, 
        last_name || null,
        mail || null,
        password || null, // In production, should use hashed password
        birthdate || null
      ];

      const result = await pool.query(
        `INSERT INTO il_sec_users 
          (username, name, last_name, mail, password, birthdate)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        params
      );
      
      // Create user object for token generation
      const newUser = {
        id: result.rows[0].id,
        username,
        name,
        lastName: last_name,
        email: mail
      };
      
      // Generate token using imported function
      const token = generateToken(newUser);
      
      // Return token and user data using imported function
      res.status(200).json(formatUserResponse(newUser, token, 'User created and logged in'));
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
  });

  // User login route
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      // Check if the user exists in the database
      const users = await pool.query(
        'SELECT id, username, name, last_name, mail FROM il_sec_users WHERE (username = $1 OR mail = $1) AND password = $2 AND status = 1',
        [username, password] // In production, should compare hashed passwords
      );
      
      if (users.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = users.rows[0];
      
      // Generate token using imported function
      const token = generateToken(user);
      
      // Return response using imported function
      res.status(200).json(formatUserResponse(user, token, 'Login successful'));
    } catch (error) {
      res.status(500).json({ error: 'Authentication failed', details: error.message });
    }
  });

  // Example of a protected route using the authenticateUser middleware
  router.get('/me', authenticateUser, (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}

module.exports = setupSecurityRoutes;
