const express = require('express');
const router = express.Router();

function setupSecurityRoutes(pool) {
  // User creation route
  router.post('/user', async (req, res) => {
    try {
      const {
        username,
        name,
        last_name,
        mail,
        password,
        birthdate,
      } = req.body;
      
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
        password || null,
        birthdate || null
      ];

      const [result] = await pool.execute(
        `INSERT INTO il_sec_users 
          (username, name, last_name, mail, password, birthdate)
         VALUES (?, ?, ?, ?, ?, ?)`,
        params
      );

      res.status(201).json({ id: result.insertId, message: 'User created' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = setupSecurityRoutes;
