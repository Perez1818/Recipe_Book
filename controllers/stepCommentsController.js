const pool = require("../database/pool.js");

// POST /step-comments
exports.createStepComment = async (req, res) => {
    const { recipe_id, step_num, content } = req.body;
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ error: "not_authenticated" });
    if (!recipe_id || !step_num || !content) return res.status(400).json({ error: "missing_fields" });

    try {
        const result = await pool.query(
            `INSERT INTO step_comments (recipe_id, user_id, step_num, content)
             VALUES ($1, $2, $3, $4)
             RETURNING id, recipe_id, user_id, step_num, content, created_at`,
            [recipe_id, user_id, step_num, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("createStepComment error:", err);
        res.status(500).json({ error: "failed_to_create" });
    }
};

// GET /step-comments/:recipeId/:stepNum
exports.getStepComments = async (req, res) => {
    const recipe_id = Number(req.params.recipeId);
    const step_num = Number(req.params.stepNum);
    if (!recipe_id || !step_num) return res.status(400).json({ error: "missing_fields" });

    try {
        const result = await pool.query(
            `SELECT sc.*, u.username FROM step_comments sc
             JOIN users u ON sc.user_id = u.id
             WHERE sc.recipe_id = $1 AND sc.step_num = $2
             ORDER BY sc.created_at ASC`,
            [recipe_id, step_num]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("getStepComments error:", err);
        res.status(500).json({ error: "failed_to_fetch" });
    }
};

// PATCH /step-comments/:id
exports.updateStepComment = async (req, res) => {
    const commentId = Number(req.params.id);
    const userId = req.user?.id;
    const { content } = req.body;
    if (!userId) return res.status(401).json({ error: "not_authenticated" });
    if (!commentId || !content) return res.status(400).json({ error: "missing_fields" });

    try {
        const result = await pool.query(
            `UPDATE step_comments SET content = $1
             WHERE id = $2 AND user_id = $3
             RETURNING id, content, updated_at`,
            [content, commentId, userId]
        );
        if (result.rowCount === 0) {
            return res.status(403).json({ error: "not_authorized" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("updateStepComment error:", err);
        res.status(500).json({ error: "failed_to_update" });
    }
};

// DELETE /step-comments/:id
exports.deleteStepComment = async (req, res) => {
    const commentId = Number(req.params.id);
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "not_authenticated" });
    if (!commentId) return res.status(400).json({ error: "missing_fields" });

    try {
        const result = await pool.query(
            `DELETE FROM step_comments WHERE id = $1 AND user_id = $2`,
            [commentId, userId]
        );
        if (result.rowCount === 0) {
            return res.status(403).json({ error: "not_authorized" });
        }
        res.json({ message: "deleted" });
    } catch (err) {
        console.error("deleteStepComment error:", err);
        res.status(500).json({ error: "failed_to_delete" });
    }
};