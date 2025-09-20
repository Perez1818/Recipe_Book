const dotenv = require("dotenv");
const { Client } = require("pg");

const PARENT_DIRECTORY = __dirname;
dotenv.config({ path: `${PARENT_DIRECTORY}/../.env` });

async function seedDatabase() {
    const client = new Client({ connectionString: process.env.DATABASE_CONNECTION_STRING });
    await client.connect();

    // Note that the query function is asynchronous

    /* To ensure that usernames and emails cannot be created with different cases:
     * https://www.postgresql.org/docs/15/citext.html
     */
    await client.query(`CREATE EXTENSION IF NOT EXISTS citext;`);
    await client.query(`DROP TABLE IF EXISTS users;`);
    await client.query(`CREATE TABLE IF NOT EXISTS users(
                  id SERIAL PRIMARY KEY,
                  username CITEXT NOT NULL,
                  email CITEXT NOT NULL,
                  password TEXT NOT NULL,
                  avatar TEXT NOT NULL,

                  UNIQUE(username),
                  UNIQUE(email)
    );`);

    /* https://www.npmjs.com/package/connect-pg-simple?activeTab=readme */
    await client.query(`DROP TABLE IF EXISTS "session";`);
    await client.query(`CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL
        )
        WITH (OIDS=FALSE);`);
    await client.query(`ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;`);
    await client.query(`CREATE INDEX "IDX_session_expire" ON "session" ("expire");`);

    await client.end();
}

seedDatabase()
