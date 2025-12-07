const dotenv = require("dotenv");
const pool = require("./pool.js");

const PARENT_DIRECTORY = __dirname;
const UPLOADS_DIRECTORY = `${PARENT_DIRECTORY}/../public/uploads`;
const CHALLENGE_DIRECTORY = `${UPLOADS_DIRECTORY}/challenge`;

dotenv.config({ path: `${PARENT_DIRECTORY}/../.env` });

async function createChallenge(userId, title, description, thumbnail, start, cutoff, points, requiredIngredients, maxIngredients) {
    try {
        const result = await pool.query(`INSERT INTO challenges (user_id, title, description, thumbnail,
                                                                 start, cutoff, points,
                                                                 required_ingredients, max_ingredients)

                                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`, [userId, title, description, thumbnail,
                                                                                         start, cutoff, points,
                                                                                         requiredIngredients, maxIngredients]);
        return true;
    }
    catch (exception) {
        console.log(exception);
        return false;
    }
}

module.exports = {
    createChallenge
}
