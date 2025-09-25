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

                  UNIQUE(username),
                  UNIQUE(email)
    );`);

    await client.query(`CREATE TABLE IF NOT EXISTS recipes(
                  id SERIAL PRIMARY KEY,
                  name TEXT NOT NULL,
                  description TEXT NOT NULL, 
                  cook_minutes INT, 
                  serving_size INT,
                  tags TEXT[],
                  is_published BOOLEAN NOT NULL
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
                  has_image BOOLEAN,
                  PRIMARY KEY (recipe_id, step_num),
                  CONSTRAINT fk_instructions_recipes FOREIGN KEY (recipe_id) REFERENCES recipes (id)
    );`);

    await client.end();
}

seedDatabase()
