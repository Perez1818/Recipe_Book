const dotenv = require("dotenv");
const { Pool } = require("pg");

const CURRENT_WORKING_DIRECTORY = __dirname;
dotenv.config({ path: `${CURRENT_WORKING_DIRECTORY}/../.env` });

const pool = new Pool({ connectionString: process.env.DATABASE_CONNECTION_STRING });

function getOnlyRow(rows) {
    if (rows.length === 1) {
        return rows[0];
    }
    else if (rows.length === 0) {
        return null;
    }
    throw new Error("More than one matching row was found in the database. Please review and update the uniqueness constraints or re-evaluate calling this function.");
}

async function getUserById(id) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE (id = $1);`, [id]);
    return getOnlyRow(rows);
}

async function getUser(username) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE (username = $1 OR email = $1);`, [username]);
    return getOnlyRow(rows);
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
    getUser,
    getUserById,
    addUser
}
