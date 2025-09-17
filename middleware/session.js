const session = require("express-session");
const dotenv = require("dotenv");

const PARENT_DIRECTORY = __dirname;
dotenv.config({ path: `${PARENT_DIRECTORY}/../.env` });

function sessionMiddleware() {
    return session({ secret: process.env.EXPRESS_SESSION_SECRET, resave: false, saveUninitialized: false });
}

module.exports = sessionMiddleware;
