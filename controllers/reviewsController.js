const pool = require("../database/pool.js");

const asArray = (v) => Array.isArray(v) ? v : [];

// POST /reviews
async function createReview(req, res) {
    const client = await pool.connect();
    try {
        const {
            recipe_id,
            user_id,
            rating,
            content,
            num_likes = 0,
            num_dislikes = 0,
        } = req.body || {};

        if (!recipe_id || !rating) {
            return res.status(400).json({ error: 'id and rating are required' });
        }

        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO reviews (recipe_id, user_id, rating, content, num_likes, num_dislikes)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING id, recipe_id, user_id, rating, content, num_likes, num_dislikes, created_at`,
            [
                recipe_id, user_id || null,
                Number(rating),
                String(content).trim() || "",
                Number(num_likes),
                Number(num_dislikes),
            ]
        );
        const newReview = result.rows[0];

        await client.query('COMMIT');
        return res.status(201).json({ message: 'created', review: newReview });
    } catch (err) {
        // Unique violation
        if (err.code === "23505") {
            return res.status(400).json({ error: "You’ve already reviewed this recipe." });
        }
        await client.query('ROLLBACK');
        console.error('createReview error:', err);
        return res.status(500).json({ error: 'failed_to_create' });
    } finally {
        client.release();
    }
}

// PUT /reviews/:id
async function updateReview(req, res) {
    const client = await pool.connect();
    try {
        const reviewId = Number(req.params.id);
        if (!reviewId) {
            return res.status(400).json({
                error: 'invalid id'
            });
        }

        const { rating, content, num_likes, num_dislikes, edited_flag = false } = req.body || {};
        
        if ( rating === undefined && content === undefined && num_likes === undefined && num_dislikes === undefined ) {
            return res.status(400).json({ error: 'No update fields were provided.' });
        }

        await client.query('BEGIN');

        const result = await client.query(
        `UPDATE reviews
            SET 
                rating = COALESCE($1, rating),
                content = COALESCE($2, content),
                num_likes = COALESCE($3, num_likes),
                num_dislikes = COALESCE($4, num_dislikes),
                edited_flag = $5
             WHERE id=$6`,
        [rating, content, num_likes, num_dislikes, edited_flag, reviewId]
        );

        await client.query('COMMIT');

        if (result.rowCount === 0) {
            return res.status(404).json({error: "Review not found"})
        }
        return res.json({ message: 'updated', review: result.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('updateReview error:', err);
        return res.status(500).json({ error: 'failed_to_update' });
    } finally {
        client.release();
    }
}

// GET /reviews
async function listReviews(_req, res) {
    const r = await pool.query(
        `SELECT id, recipe_id, user_id, rating, content, num_likes, num_dislikes, created_at
        FROM reviews
        ORDER BY created_at DESC`
    );
    return res.json({ items: r.rows });
}

// GET /reviews/:id
async function getReview(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid id' });

    const r = await pool.query(
        `SELECT id, recipe_id, user_id, rating, content, num_likes, num_dislikes, created_at, edited_flag
        FROM reviews WHERE id=$1`,
        [id]
    );
    if (r.rowCount === 0) {
        return res.status(404).json(
            { error: 'not_found' }
        );
    }

    return res.json({ ...r.rows[0] });
}

async function getReviewsByRecipe(req, res) {
    const recipeId = Number(req.params.recipeId);
    if (!recipeId) {
        return res.status(400).json({ error: "Invalid recipe ID" });
    }
    const r = await pool.query(
        `SELECT id, recipe_id, user_id, rating, content, num_likes, num_dislikes, created_at, edited_flag
        FROM reviews
        WHERE recipe_id=$1`,
        [recipeId]
    );
    return res.json({ items: r.rows })
}

async function deleteReview(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid id' });

    const r = await pool.query(`DELETE FROM reviews WHERE id=$1`, [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'not_found' });
    return res.json({ id, message: 'deleted' });
}

async function addReviewFeedback(req, res) {
    const client = await pool.connect();
    try {
        const reviewId = Number(req.params.id);
        const userId = req.user?.id || req.body.user_id;
        const { is_like } = req.body;

        if (!reviewId || userId == null)
        return res.status(400).json({ error: "Invalid review or user ID" });

        await client.query("BEGIN");

        const existing = await client.query(
        "SELECT is_like FROM review_feedback WHERE review_id = $1 AND user_id = $2",
        [reviewId, userId]
        );

        if (existing.rows.length === 0) {
        // First reaction
        await client.query(
            "INSERT INTO review_feedback (user_id, review_id, is_like) VALUES ($1, $2, $3)",
            [userId, reviewId, is_like]
        );
        await client.query(
            `UPDATE reviews
            SET num_likes = num_likes + CASE WHEN $1 THEN 1 ELSE 0 END,
                num_dislikes = num_dislikes + CASE WHEN $1 THEN 0 ELSE 1 END
            WHERE id = $2`,
            [is_like, reviewId]
        );
        } else {
        const prev = existing.rows[0].is_like;

        if (prev === is_like) {
            // Same reaction  -> remove it
            await client.query(
            "DELETE FROM review_feedback WHERE user_id = $1 AND review_id = $2",
            [userId, reviewId]
            );
            await client.query(
            `UPDATE reviews
            SET num_likes = num_likes - CASE WHEN $1 THEN 1 ELSE 0 END,
                num_dislikes = num_dislikes - CASE WHEN $1 THEN 0 ELSE 1 END
            WHERE id = $2`,
            [is_like, reviewId]
            );
        } else {
            // Opposite reaction → switch
            await client.query(
            "UPDATE review_feedback SET is_like = $1 WHERE user_id = $2 AND review_id = $3",
            [is_like, userId, reviewId]
            );
            await client.query(
            `UPDATE reviews
            SET num_likes = num_likes + CASE WHEN $1 THEN 1 ELSE -1 END,
                num_dislikes = num_dislikes + CASE WHEN $1 THEN -1 ELSE 1 END
            WHERE id = $2`,
            [is_like, reviewId]
            );
        }
        }

        await client.query("COMMIT");
        res.json({ message: "Feedback updated successfully" });
    } catch (err) {
        await client.query("ROLLBACK");

        // Catch duplicate insert error (if constraint triggers)
        if (err.code === "23505") {
        return res.status(400).json({ error: "You’ve already reacted to this review." });
        }

        console.error("addReviewFeedback error:", err);
        res.status(500).json({ error: "Failed to update feedback" });
    } finally {
        client.release();
    }
}



module.exports = {
    getReview,
    getReviewsByRecipe,
    createReview,
    updateReview,
    listReviews,
    deleteReview,
    addReviewFeedback
};
