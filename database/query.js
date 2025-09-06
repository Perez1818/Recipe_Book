const dotenv = require("dotenv");
const { Pool } = require("pg");

const CURRENT_WORKING_DIRECTORY = __dirname;
dotenv.config({ path: `${CURRENT_WORKING_DIRECTORY}/../.env` });

const pool = new Pool({ connectionString: process.env.DATABASE_CONNECTION_STRING });

module.exports = {
    pool
}
