const dotenv = require("dotenv");
const { Client } = require("pg");

const CURRENT_WORKING_DIRECTORY = __dirname;
dotenv.config({ path: `${CURRENT_WORKING_DIRECTORY}/../.env` });

async function seedDatabase() {
    const client = new Client({ connectionString: process.env.DATABASE_CONNECTION_STRING });
    await client.connect();

    // Note that the query function is asynchronous
    await client.query(`DROP TABLE IF EXISTS users;`);
    await client.query(`CREATE TABLE IF NOT EXISTS users(
                  id SERIAL PRIMARY KEY,
                  username VARCHAR(100) NOT NULL,
                  email VARCHAR(100) NOT NULL,
                  password VARCHAR(100) NOT NULL,

                  UNIQUE(username),
                  UNIQUE(email)
    );`);

    await client.end();
}

seedDatabase()
