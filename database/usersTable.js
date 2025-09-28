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

async function getUserByName(username) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE username = $1;`, [username]);
    return getOnlyRow(rows);
}

async function getUserByEmail(email) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1;`, [email]);
    return getOnlyRow(rows);
}

async function usernameIsAvailable(username) {
    const user = await getUserByName(username);
    if (user) {
        return false;
    }
    return true;
}

async function emailIsAvailable(email) {
    const user = await getUserByEmail(email);
    if (user) {
        return false;
    }
    return true;
}

async function getUserByNameOrEmail(username) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE (username = $1 OR email = $1);`, [username]);
    return getOnlyRow(rows);
}

async function getHashedPassword(password) {
    return await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_LENGTH));
}

async function createUser(username, email, password) {
    try {
        /* https://stackoverflow.com/a/46713082 */
        const hashedPassword = await getHashedPassword(password);
        const result = await pool.query(`INSERT INTO users (username, email, password, avatar)
                                         VALUES ($1, $2, $3, $4);`, [username, email, hashedPassword, DEFAULT_AVATAR_URL]);
        return true;
    }
    catch (exception) {
        console.log(exception);
        return false;
    }
}

async function comparePasswords(plaintextPassword, hashedPassword) {
    return await bcrypt.compare(plaintextPassword, hashedPassword);
}

async function updateAvatar(id, avatarUrl) {
    return await pool.query("UPDATE users SET avatar = $1 WHERE id = $2;", [avatarUrl, id]);
}

async function updateUsername(id, username) {
    return await pool.query("UPDATE users SET username = $1 WHERE id = $2;", [username, id]);
}

async function updateBiography(id, biography) {
    return await pool.query("UPDATE users SET biography = $1 WHERE id = $2;", [biography, id]);
}

async function updateEmail(id, email) {
    return await pool.query("UPDATE users SET email = $1 WHERE id = $2;", [email, id]);
}

async function updatePassword(id, password) {
    const hashedPassword = await getHashedPassword(password);
    return await pool.query("UPDATE users SET password = $1 WHERE id = $2;", [hashedPassword, id]);
}

async function updateBirthday(id, birthday) {
    return await pool.query("UPDATE users SET birthday = $1 WHERE id = $2;", [birthday, id]);
}


/* Avoid listing all exports manually
 */
module.exports = {
    getUserByName,
    getUserByEmail,
    usernameIsAvailable,
    emailIsAvailable,
    getUserByNameOrEmail,
    getUserById,
    createUser,
    comparePasswords,
    updateAvatar,
    updateUsername,
    updateBiography,
    updateEmail,
    updatePassword,
    updateBirthday
}
