const express = require('express');
const router = express.Router();

function setupCycleRoutes(pool) {
  // User creation route
  router.post('/cycle', async (req, res) => {
    try {
      const {
        init,
        end,
      } = req.body;
      
      // Validate required fields
      if (!init || !end ) {
        return res.status(400).json({ error: 'Init and End are required' });
      }
      
      // Prepare parameters, using null for any undefined values
      const params = [
        init || null,
        end || null
      ];

      const [result] = await pool.execute(
        `INSERT INTO il_app_cycles
          (init, end)
         VALUES (?, ?)`,
        params
      );

      res.status(201).json({ id: result.insertId, message: 'Cycle created' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = setupCycleRoutes;
