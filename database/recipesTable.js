const dotenv = require("dotenv");
const pool = require("./pool.js");

const PARENT_DIRECTORY = __dirname;
dotenv.config({ path: `${PARENT_DIRECTORY}/../.env` });

async function getRecipesByTagOrCountry(tag, country) {
    const { rows } = await pool.query(`SELECT * FROM recipes WHERE ($1 = ANY(tags) OR $2 = ANY(tags));`, [tag, country]);
    return rows;
}

module.exports = {
    getRecipesByTagOrCountry
}
