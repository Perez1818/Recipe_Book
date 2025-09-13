const dotenv = require("dotenv");
const CURRENT_WORKING_DIRECTORY = __dirname;
dotenv.config({ path: `${CURRENT_WORKING_DIRECTORY}/../.env` });

const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_CONNECTION_STRING });

module.exports = pool;
