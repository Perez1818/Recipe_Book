const dotenv = require("dotenv");
const pool = require("./pool.js");

const PARENT_DIRECTORY = __dirname;
dotenv.config({ path: `${PARENT_DIRECTORY}/../.env` });

async function getRecipesByTag(tag) {
    const { rows } = await pool.query(`SELECT * FROM recipes WHERE $1 = ANY(tags);`, [tag]);
    return rows;
}

module.exports = {
    getRecipesByTag
}
