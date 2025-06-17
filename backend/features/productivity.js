const express = require('express');
const router = express.Router();
const { categorize } = require('./vertex'); // Assuming vertex.js is in the same directory
const { authenticateUser } = require('../middlewares/auth');

function setupProductivityRoutes(pool) {
    // User creation route
    router.post('/task', authenticateUser, async (req, res) => {
        try {
            const {
                description,
            } = req.body;

            // Validate required fields
            if (!description) {
                return res.status(400).json({ error: 'Description is required' });
            }

            // Prepare parameters, using null for any undefined values
            const params = [
                description || null
            ];

            // User ID is now available from the middleware
            const user_id = req.userId;

            // call vertex.js to categorize the task
            const category = await categorize(description);
            if (!category) {
                return res.status(400).json({ error: 'Category not found' });
            }

            const result = await pool.query(
                `INSERT INTO il_app_tasks
                    (user_id, description, category_id, created_by, updated_by)
                    VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [user_id, description || null, category || null, user_id, user_id]
            );

            // convert category to int
            const categoryId = parseInt(category, 10);

            task = {
                id: result.rows[0].id,
                user_id: user_id,
                description: description || null,
                category_id: categoryId || null,
                created_by: user_id,
                updated_by: user_id
            };

            res.status(200).json({ task: task, message: 'Task created'  });
        } catch (error) {
            if (error.code === '23505') { // PostgreSQL unique violation
                return res.status(409).json({ error: 'Task already exists' });
            }
            res.status(500).json({ error: error.message });
        }
    });

    // Get all tasks from a user
    router.get('/productivity', authenticateUser, async (req, res) => {
        try {
            // const {
            //     init,
            //     end,
            // } = req.query;

            // // Prepare parameters, using null for any undefined values
            // const params = [
            //     init || null,
            //     end || null
            // ];

            // User ID is now available from the middleware
            const user_id = req.userId;

            let sqlQuery = `SELECT * FROM il_app_tasks WHERE user_id = $1 AND status = 1`;
            let queryParams = [user_id];
            
            const result = await pool.query(sqlQuery, queryParams);

            // group by category
            const groupedTasks = {};
            result.rows.forEach(task => {
                if (!groupedTasks[task.category_id]) {
                    groupedTasks[task.category_id] = [];
                }
                groupedTasks[task.category_id].push(task);
            });
            
            res.status(200).json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Delete a task by ID
    router.delete('/task/:id', authenticateUser, async (req, res) => {
        try {
            const taskId = req.params.id;
            
            // User ID is now available from the middleware
            const user_id = req.userId;

            // First check if the task belongs to the user
            const checkResult = await pool.query(
                'SELECT id FROM il_app_tasks WHERE id = $1 AND user_id = $2',
                [taskId, user_id]
            );

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ error: 'task not found or not authorized to delete' });
            }

            // Delete the task
            const deleteResult = await pool.query(
                'UPDATE il_app_tasks SET status = 0 WHERE id = $1 AND user_id = $2',
                [taskId, user_id]
            );

            if (deleteResult.rowCount === 0) {
                return res.status(404).json({ error: 'task not found' });
            }

            res.status(200).json({ message: 'task deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

module.exports = setupProductivityRoutes;