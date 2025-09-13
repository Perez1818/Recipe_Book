const dotenv = require("dotenv");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

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

async function getUserByNameOrEmail(username) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE (username = $1 OR email = $1);`, [username]);
    return getOnlyRow(rows);
}

async function createUser(username, email, password) {
    try {
        /* https://stackoverflow.com/a/46713082 */
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_LENGTH));
        const result = await pool.query(`INSERT INTO users (username, email, password)
                                         VALUES ($1, $2, $3);`, [username, email, hashedPassword]);
        return true;
    }
    catch {
        return false;
    }
}

async function comparePasswords(plaintextPassword, hashedPassword) {
    return await bcrypt.compare(plaintextPassword, hashedPassword);
}

/* TODO: Potentially avoid listing all exports manually
 */
module.exports = {
    pool,
    getUserByNameOrEmail,
    getUserById,
    createUser,
    comparePasswords
}
