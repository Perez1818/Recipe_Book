const dotenv = require("dotenv");
const pool = require("./pool.js");
const bcrypt = require("bcryptjs");

const PARENT_DIRECTORY = __dirname;
const DEFAULT_AVATAR_URL = "/static/img/Portrait_Placeholder.png";

dotenv.config({ path: `${PARENT_DIRECTORY}/../.env` });

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
        const result = await pool.query(`INSERT INTO users (username, email, password, avatar)
                                         VALUES ($1, $2, $3, $4);`, [username, email, hashedPassword, DEFAULT_AVATAR_URL]);
        return true;
    }
    catch {
        return false;
    }
}

async function getAllUsers() {
    const { rows } = await pool.query("SELECT * FROM users");
    return rows;
}

async function comparePasswords(plaintextPassword, hashedPassword) {
    return await bcrypt.compare(plaintextPassword, hashedPassword);
}

async function updateAvatar(id, avatarUrl) {
    return await pool.query("UPDATE users SET avatar = $1 WHERE id = $2;", [avatarUrl, id]);
}

async function getAvatar(id) {
    const user = await getUserById(id);
    return user.avatar;
}

/* Avoid listing all exports manually
 */
module.exports = {
    pool,
    getUserByNameOrEmail,
    getUserById,
    createUser,
    getAllUsers,
    comparePasswords,
    updateAvatar,
    getAvatar,
}
