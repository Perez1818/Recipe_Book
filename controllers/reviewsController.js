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
            created_at
        } = req.body || {};

        if (!recipe_id || !rating) {
            return res.status(400).json({ error: 'id and rating are required' });
        }

        await client.query('BEGIN');

        const r = await client.query(
            `INSERT INTO reviews (recipe_id, user_id, rating, content, num_likes, num_dislikes, created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING recipe_id, user_id, rating, content, num_likes, num_dislikes, created_at`,
            [
                recipe_id, user_id || null,
                Number(rating),
                String(content).trim() || "",
                Number(num_likes),
                Number(num_dislikes),
                created_at || Date.now(),
            ]
        );
        const id = r.rows[0].id;

        await client.query('COMMIT');
        return res.status(201).json({ id: id, message: 'created' });
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

        const {
            recipe_id,
            user_id,
            rating,
            content,
            num_likes = 0,
            num_dislikes = 0,
            created_at
        } = req.body || {};

        if (!recipe_id || !user_id || !rating) {
            return res.status(400).json({ error: 'recipe_id, user_id, and rating are required' });
        }

        await client.query('BEGIN');

        await client.query(
        `UPDATE reviews
            SET rating=$1,
                content=$2,
                num_likes=$3,
                num_dislikes=$4,
                created_at=$5,
                updated_at=$6,
        WHERE id=$7`,
        [
            Number(rating),
            String(content).trim(),
            Number(num_likes) || 0,
            Number(num_dislikes) || 0,
            created_at,
            updated_at || Date.now(),
            id
        ]
        );

        await client.query('COMMIT');
        return res.json({ id: id, message: 'updated' });
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
        `SELECT id, recipe_id, user_id, rating, content, num_likes, num_dislikes, created_at, updated_at
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
        return res.status(400)
    }
    const r = await pool.query(
        `SELECT id, recipe_id, user_id, rating, content, num_likes, num_dislikes, created_at, updated_at FROM reviews WHERE id=$1 DESC`,
        [recipeId]
    );
    return res.json({ items: result.rows })
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
