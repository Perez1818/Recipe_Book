const dotenv = require("dotenv");
const pool = require("./pool.js");
const bcrypt = require("bcryptjs");
const { deleteFile } = require("../middleware/helpers.js");

const PARENT_DIRECTORY = __dirname;
const UPLOADS_DIRECTORY = `${PARENT_DIRECTORY}/../public/uploads`;
const AVATAR_DIRECTORY = `${UPLOADS_DIRECTORY}/avatar`;

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
        const result = await pool.query(`INSERT INTO users (username, email, password)
                                         VALUES ($1, $2, $3);`, [username, email, hashedPassword]);
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

async function updateAvatar(id, fileName) {
    const user = await getUserById(id);
    if (user.avatar) {
        deleteFile(`${AVATAR_DIRECTORY}/${user.avatar}`);
    }
    return await pool.query("UPDATE users SET avatar = $1 WHERE id = $2;", [fileName, id]);
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

async function updateVerifiedStatus(id, email, verified) {
    return await pool.query("UPDATE users SET is_verified = $1, email = $2 WHERE id = $3;", [verified, email, id]);
}

async function verifyUser(id, email) {
    return await updateVerifiedStatus(id, email, true);
}

async function getUserRecipes(id) {
    const { rows } = await pool.query(`SELECT * FROM recipes WHERE user_id = $1;`, [id]);
    return rows;
}

async function listUsers() {
    const { rows } = await pool.query(`SELECT username, points FROM users ORDER BY points DESC;`);
    return rows;
}

async function followUser(followerId, followeeId) {
    if (!followerId || !followeeId || followerId === followeeId) return false;
    try {
        await pool.query(
            `INSERT INTO followers (follower_id, followee_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [followerId, followeeId]
        );
        return true;
    } catch (e) {
        console.error('followUser error', e);
        return false;
    }
}

async function unfollowUser(followerId, followeeId) {
    try {
        const r = await pool.query(
            `DELETE FROM followers WHERE follower_id=$1 AND followee_id=$2`,
            [followerId, followeeId]
        );
        return r.rowCount > 0;
    } catch (e) {
        console.error('unfollowUser error', e);
        return false;
    }
}

async function getFollowers(userId) {
    const { rows } = await pool.query(
        `SELECT u.* FROM followers f JOIN users u ON u.id = f.follower_id WHERE f.followee_id = $1 ORDER BY f.created_at DESC`,
        [userId]
    );
    return rows;
}

async function getFollowing(userId) {
    const { rows } = await pool.query(
        `SELECT u.* FROM followers f JOIN users u ON u.id = f.followee_id WHERE f.follower_id = $1 ORDER BY f.created_at DESC`,
        [userId]
    );
    return rows;
}

async function isFollowing(followerId, followeeId) {
    const { rows } = await pool.query(
        `SELECT 1 FROM followers WHERE follower_id=$1 AND followee_id=$2 LIMIT 1`,
        [followerId, followeeId]
    );
    return rows.length === 1;
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
    updateBirthday,
    verifyUser,
    getUserRecipes,
    listUsers,
    followUser, // from follow-user-old branch
    unfollowUser, // from follow-user-old branch
    getFollowers, // from follow-user-old branch
    getFollowing, // from follow-user-old branch
    isFollowing // from follow-user-old branch
}
