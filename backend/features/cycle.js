const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/auth');

function setupCycleRoutes(pool) {
    
    // User creation route
    router.post('/cycle', authenticateUser, async (req, res) => {
        try {
            const {
                init,
                end,
            } = req.body;

            // Validate required fields
            if (!init || !end) {
                return res.status(400).json({ error: 'Init and End are required' });
            }

            // Prepare parameters, using null for any undefined values
            const params = [
                init || null,
                end || null
            ];

            // User ID is now available from the middleware
            const user_id = req.userId;

            const result = await pool.query(
                `INSERT INTO il_app_cycles
          (user_id, init, "end", created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [user_id, init || null, end || null, user_id, user_id]
            );

            res.status(200).json({ id: result.rows[0].id, message: 'Cycle created' });
        } catch (error) {
            if (error.code === '23505') { // PostgreSQL unique violation
                return res.status(409).json({ error: 'Cycle already exists' });
            }
            res.status(500).json({ error: error.message });
        }
    });

    // Get all cycles from a user
    router.get('/cycle', authenticateUser, async (req, res) => {
        try {
            const {
                init,
                end,
            } = req.query;

            // Prepare parameters, using null for any undefined values
            const params = [
                init || null,
                end || null
            ];

            // User ID is now available from the middleware
            const user_id = req.userId;

            let sqlQuery = `SELECT * FROM il_app_cycles WHERE user_id = $1 AND status = 1`;
            let queryParams = [user_id];
            let paramIndex = 2;

            if (init) {
                sqlQuery += ` AND init >= $${paramIndex}`;
                queryParams.push(init);
                paramIndex++;
            }

            if (end) {
                sqlQuery += ` AND "end" <= $${paramIndex}`;
                queryParams.push(end);
            }

            sqlQuery += ` ORDER BY init ASC`;
            
            const result = await pool.query(sqlQuery, queryParams);

            res.status(200).json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Delete a cycle by ID
    router.delete('/cycle/:id', authenticateUser, async (req, res) => {
        try {
            const cycleId = req.params.id;
            
            // User ID is now available from the middleware
            const user_id = req.userId;

            // First check if the cycle belongs to the user
            const checkResult = await pool.query(
                'SELECT id FROM il_app_cycles WHERE id = $1 AND user_id = $2',
                [cycleId, user_id]
            );

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ error: 'Cycle not found or not authorized to delete' });
            }

            // Delete the cycle
            const deleteResult = await pool.query(
                'UPDATE il_app_cycles SET status = 0 WHERE id = $1 AND user_id = $2',
                [cycleId, user_id]
            );

            if (deleteResult.rowCount === 0) {
                return res.status(404).json({ error: 'Cycle not found' });
            }

            res.status(200).json({ message: 'Cycle deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

module.exports = setupCycleRoutes;
