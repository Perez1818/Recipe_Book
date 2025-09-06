const dotenv = require("dotenv");
const { Pool } = require("pg");

const CURRENT_WORKING_DIRECTORY = __dirname;
dotenv.config({ path: `${CURRENT_WORKING_DIRECTORY}/../.env` });

const pool = new Pool({ connectionString: process.env.DATABASE_CONNECTION_STRING });

async function checkUser(username, password) {
    const result = await pool.query(`SELECT * FROM users WHERE (username = $1 OR email = $1) AND password = $2;`, [username, password]);
    if (result.rows.length === 1) {
        return true;
    }
    else if (result.rows.length === 0) {
        return false;
    }
    throw new Error("More than one matching user was found in the database.");
}

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

/* TODO: Potentially avoid listing all exports manually
 */
module.exports = {
    pool,
    addUser,
    checkUser
}
