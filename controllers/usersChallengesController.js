const pool = require("../database/pool.js");

exports.participateInChallenge = async (request, response) => {
    const userId = Number(request.params.userId);
    const challengeId = Number(request.params.challengeId);
    if (!userId) return response.status(400).json({ error: "invalid user id" });
    if (!challengeId) return response.status(400).json({ error: "invalid challenge id" });
    const client = await pool.connect();
    try {
        const { liked = false, status = "participating" } = request.body || {};
        await client.query('BEGIN');
        const result = await client.query(
            `INSERT INTO usersChallenges (user_id, challenge_id, liked, status)
            VALUES ($1, $2, $3, $4)
            RETURNING id, user_id, challenge_id, liked, status`,
            [userId, challengeId, liked, status]
        )
        const newUserChallenge = result.rows[0];

        await client.query('COMMIT');
        return response.status(201).json({ message: 'created', userChallenge: newUserChallenge });
    } catch (err) {
        await client.query('ROLLBACK');
        // Unique violation
        if (err.code === "23505") {
            return response.status(400).json({ error: "You’ve already participated in this challenge." });
        }
        console.error('participateInChallenge error:', err);
        return response.status(500).json({ error: 'failed_to_create' });
    } finally {
        client.release();
    }
}

exports.updateUserChallengeDetails = async (request, response) => {
    const userId = Number(request.params.userId);
    const challengeId = Number(request.params.challengeId);
    const { liked, status } = request.body || {};

    if (!userId || !challengeId)
        return response.status(400).json({ error: "invalid parameters" });

    try {
        const result = await pool.query(
        `UPDATE usersChallenges
        SET liked = COALESCE($3, liked),
            status = COALESCE($4, status)
        WHERE user_id = $1 AND challenge_id = $2
        RETURNING id, user_id, challenge_id, liked, status`,
        [userId, challengeId, liked, status]
        );

        if (result.rowCount === 0)
        return response.status(404).json({ error: "not found" });

        return response.json({ message: "updated", userChallenge: result.rows[0] });
    } catch (err) {
        console.error("updateUserChallengeDetails error:", err);
        return response.status(500).json({ error: "failed_to_update" });
    }
};


exports.getUserChallengeDetails = async (request, response) => {
    const userId = Number(request.params.userId);
    const challengeId = Number(request.params.challengeId);

    if (!userId || !challengeId)
        return response.status(400).json({ error: "invalid parameters" });

    try {
        const result = await pool.query(
        `SELECT id, user_id, challenge_id, liked, status
        FROM usersChallenges
        WHERE user_id = $1 AND challenge_id = $2`,
        [userId, challengeId]
        );

        if (result.rowCount === 0)
        return response.status(404).json({ error: "not found" });

        return response.json(result.rows[0]);
    } catch (err) {
        console.error("getUserChallengeDetails error:", err);
        return response.status(500).json({ error: "failed_to_fetch" });
    }
};

exports.getChallengeLikes = async (request, response) => {
    const challengeId = Number(request.params.challengeId);
    if (!challengeId) return response.status(400).json({ error: "invalid challenge id" });

    try {
        const result = await pool.query(
            `SELECT user_id
            FROM usersChallenges
            WHERE challenge_id = $1 AND liked = true`,
            [challengeId]
        );

        return response.json({ likes: result.rowCount, users: result.rows });
    } catch (err) {
        console.error("getChallengeLikes error:", err);
        return response.status(500).json({ error: "failed_to_fetch_likes" });
    }
};

exports.getChallengeParticipantCount = async (request, response) => {
    const challengeId = Number(request.params.challengeId);
    if (!challengeId) return response.status(400).json({ error: "invalid challenge id" });

    try {
        const result = await pool.query(
            `SELECT user_id
            FROM usersChallenges
            WHERE challenge_id = $1 AND status = 'participating'`,
            [challengeId]
        );

        return response.json({ numOfParticipants: result.rowCount });
    } catch (err) {
        console.error("getChallengeParticipantCount error:", err);
        return response.status(500).json({ error: "failed_to_fetch_participant_count" });
    }
};

exports.getChallengeWinnerCount = async (request, response) => {
    const challengeId = Number(request.params.challengeId);
    if (!challengeId) return response.status(400).json({ error: "invalid challenge id" });

    try {
        const result = await pool.query(
            `SELECT user_id
            FROM usersChallenges
            WHERE challenge_id = $1 AND status = 'completed'`,
            [challengeId]
        );

        return response.json({ numOfWinners: result.rowCount });
    } catch (err) {
        console.error("getChallengeWinnerCount error:", err);
        return response.status(500).json({ error: "failed_to_fetch_winner_count" });
    }
};

exports.deleteUserChallenge = async (request, response) => {
    const userId = Number(request.params.userId);
    const challengeId = Number(request.params.challengeId);
    if (!userId) return response.status(400).json({ error: "invalid user id" });
    if (!challengeId) return response.status(400).json({ error: "invalid challenge id" });

    try {
        const result = await pool.query(
            `DELETE FROM usersChallenges
            WHERE user_id=$1 AND challenge_id=$2`,
            [userId, challengeId]);
        if (result.rowCount === 0) return response.status(404).json({ error: 'not_found' });
        return response.json({ message: 'deleted' });
    } catch (err) {
        console.error("deleteUserChallenge error:", err);
        return response.status(500).json({ error: "failed_to_delete_user_challenge" });
    } 
}