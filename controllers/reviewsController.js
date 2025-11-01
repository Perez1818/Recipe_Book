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
            created_at,
        } = req.body || {};

        if (!recipe_id || !rating) {
            return res.status(400).json({ error: 'id and rating are required' });
        }

        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO reviews (recipe_id, user_id, rating, content, num_likes, num_dislikes, created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING id, recipe_id, user_id, rating, content, num_likes, num_dislikes, created_at`,
            [
                recipe_id, user_id || null,
                Number(rating),
                String(content).trim() || "",
                Number(num_likes),
                Number(num_dislikes),
                created_at || Date.now(),
            ]
        );
        const newReview = result.rows[0];

        await client.query('COMMIT');
        return res.status(201).json({ message: 'created', review: newReview });
    } catch (err) {
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
        FROM reviews WHERE id=$1 DESC`,
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

module.exports = {
    getReview,
    getReviewsByRecipe,
    createReview,
    updateReview,
    listReviews,
    deleteReview,
};
