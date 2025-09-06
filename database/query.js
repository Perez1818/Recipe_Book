const dotenv = require("dotenv");
const { Pool } = require("pg");

const CURRENT_WORKING_DIRECTORY = __dirname;
dotenv.config({ path: `${CURRENT_WORKING_DIRECTORY}/../.env` });

const pool = new Pool({ connectionString: process.env.DATABASE_CONNECTION_STRING });

async function addUser(username, email, password) {
    try {
        const result = await pool.query(`INSERT INTO users (username, email, password)
                                         VALUES ($1, $2, $3);`, [username, email, password]);
        return true;
    }
    catch {
        return false;
    }
}

module.exports = {
    pool,
    addUser
}
