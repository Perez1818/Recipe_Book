const session = require("express-session");
const dotenv = require("dotenv");
const pool = require("../database/pool.js");
const connectPgSimple = require("connect-pg-simple");

const DAYS_PER_SESSION = 7;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_SESSION = DAYS_PER_SESSION * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

const PARENT_DIRECTORY = __dirname;
dotenv.config({ path: `${PARENT_DIRECTORY}/../.env` });

const pgSession = connectPgSimple(session);

function sessionMiddleware() {
    return session({
        store: new pgSession({
            pool: pool,
            tableName: "session"
        }),
        secret: process.env.EXPRESS_SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: MILLISECONDS_PER_SESSION }
    });
}

module.exports = sessionMiddleware;
