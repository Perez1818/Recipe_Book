const dotenv = require("dotenv");
const { Client } = require("pg");

const PARENT_DIRECTORY = __dirname;
dotenv.config({ path: `${PARENT_DIRECTORY}/../.env` });

async function seedDatabase() {
    const client = new Client({ connectionString: process.env.DATABASE_CONNECTION_STRING });
    await client.connect();

    // Note that the query function is asynchronous

    /* Drop tables if they exist, CASCADE keyword ensures foreign keys referencing dropped tables will also be dropped
     * https://stackoverflow.com/a/35338810
     */
    await client.query(`DROP TABLE IF EXISTS users CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "session" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS recipes CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS ingredients CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS instructions CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS challenges CASCADE;`);

    /* To ensure that usernames and emails cannot be created with different cases:
     * https://www.postgresql.org/docs/15/citext.html
     */
    await client.query(`CREATE EXTENSION IF NOT EXISTS citext;`);
    await client.query(`CREATE TABLE IF NOT EXISTS users(
                  id SERIAL PRIMARY KEY,
                  username CITEXT NOT NULL,
                  email CITEXT NOT NULL,
                  password TEXT NOT NULL,
                  avatar TEXT,

                  birthday DATE,
                  biography TEXT,

                  is_verified BOOLEAN DEFAULT false,

                  UNIQUE(username),
                  UNIQUE(email)
    );`);

    /* https://www.npmjs.com/package/connect-pg-simple?activeTab=readme */
    await client.query(`CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL
        )
        WITH (OIDS=FALSE);`);
    await client.query(`ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;`);
    await client.query(`CREATE INDEX "IDX_session_expire" ON "session" ("expire");`);

    await client.query(`CREATE TABLE IF NOT EXISTS recipes(
                  id SERIAL PRIMARY KEY,
                  user_id INT NOT NULL,
                  name TEXT NOT NULL,
                  description TEXT NOT NULL, 
                  cook_minutes INT, 
                  serving_size INT,
                  tags TEXT[],
                  is_published BOOLEAN NOT NULL,

                  thumbnail TEXT NOT NULL,
                  video TEXT,

                  CONSTRAINT fk_recipes_users FOREIGN KEY (user_id) REFERENCES users (id)
    );`);

    await client.query(`CREATE TABLE IF NOT EXISTS ingredients(
                  recipe_id INT,
                  name TEXT,
                  qty FLOAT,
                  unit TEXT,
                  PRIMARY KEY (recipe_id, name),
                  CONSTRAINT fk_ingredients_recipes FOREIGN KEY (recipe_id) REFERENCES recipes (id)
    );`);

    await client.query(`CREATE TABLE IF NOT EXISTS instructions(
                  recipe_id INT,
                  step_num INT,
                  text TEXT NOT NULL,
                  hours INT,
                  minutes INT,
                  PRIMARY KEY (recipe_id, step_num),
                  CONSTRAINT fk_instructions_recipes FOREIGN KEY (recipe_id) REFERENCES recipes (id)
    );`);

    await client.query(`CREATE TABLE IF NOT EXISTS challenges(
                  id SERIAL PRIMARY KEY,
                  user_id INT NOT NULL,
                  title TEXT NOT NULL,
                  description TEXT NOT NULL,

                  thumbnail TEXT,
                  start DATE,

                  cutoff DATE NOT NULL,

                  points INT NOT NULL,

                  required_ingredients TEXT[],
                  max_ingredients INT,

                  CONSTRAINT fk_challenges_users FOREIGN KEY (user_id) REFERENCES users (id)
    );`);

    await client.end();
}

seedDatabase()
