const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

function setupSecurityRoutes(pool) {
  // Helper function to generate JWT token
  const generateToken = (user) => {
    const secret = process.env.JWT_SECRET || 'hackathon_secret';
    const payload = { 
      userId: user.id, 
      username: user.username, 
      email: user.email || user.mail 
    };
    
    return jwt.sign(payload, secret, { expiresIn: '24h' });
  };
  
  // Helper function to format user response
  const formatUserResponse = (user, token, message) => {
    return {
      message,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        lastName: user.lastName || user.last_name,
        email: user.email || user.mail
      }
    };
  };

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

      const [result] = await pool.execute(
        `INSERT INTO il_sec_users 
          (username, name, last_name, mail, password, birthdate)
         VALUES (?, ?, ?, ?, ?, ?)`,
        params
      );
      
      // Create user object for token generation
      const newUser = {
        id: result.insertId,
        username,
        name,
        lastName: last_name,
        email: mail
      };
      
      // Generate token
      const token = generateToken(newUser);
      
      // Return token and user data
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
      const [users] = await pool.execute(
        'SELECT id, username, name, last_name, mail FROM il_sec_users WHERE (username = ? OR mail = ?) AND password = ? AND status = 1',
        [username, username, password] // In production, should compare hashed passwords
      );
      
      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = users[0];
      
      // Generate token
      const token = generateToken(user);
      
      // Return response
      res.status(200).json(formatUserResponse(user, token, 'Login successful'));
    } catch (error) {
      res.status(500).json({ error: 'Authentication failed', details: error.message });
    }
  });

  // Add token verification middleware (can be used for protected routes)
  const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hackathon_secret');
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }
  };

  // Example of a protected route
  router.get('/me', verifyToken, (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}

module.exports = setupSecurityRoutes;
