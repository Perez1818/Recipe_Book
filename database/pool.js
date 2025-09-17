const dotenv = require("dotenv");
const { Pool } = require("pg");

const PARENT_DIRECTORY = __dirname;
dotenv.config({ path: `${PARENT_DIRECTORY}/../.env` });

const pool = new Pool({ connectionString: process.env.DATABASE_CONNECTION_STRING });

module.exports = pool;
