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
    await client.query(`DROP TABLE IF EXISTS reviews CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS review_feedback CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS collections CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS challenges CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS usersChallenges CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS recipelikes CASCADE;`);

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

                  points INT DEFAULT 0,

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

    await client.query(`CREATE TABLE IF NOT EXISTS reviews(
                  id SERIAL PRIMARY KEY,
                  recipe_id INT NOT NULL,
                  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                  rating INT CHECK (rating BETWEEN 1 AND 5),
                  content TEXT NOT NULL,
                  num_likes INT,
                  num_dislikes INT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  edited_flag BOOLEAN DEFAULT FALSE,
                  CONSTRAINT unique_user_recipe_review UNIQUE (user_id, recipe_id)
    );`);

    await client.query(`CREATE TABLE IF NOT EXISTS review_feedback(
                  id SERIAL PRIMARY KEY,
                  review_id INT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
                  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                  is_like BOOLEAN NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  CONSTRAINT unique_user_review_feedback UNIQUE (user_id, review_id)
    );`);

    await client.query(`CREATE TABLE IF NOT EXISTS collections(
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                collection_name TEXT DEFAULT 'Bookmarks',
                recipe_ids INT[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_user_collection UNIQUE (user_id, collection_name)
    );`);

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
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

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

    // Define enum status for user in challenge
    await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_status') THEN
            CREATE TYPE challenge_status AS ENUM (
                'not_participating',
                'participating',
                'completed',
                'expired_before_completion'
            );
            END IF;
        END$$;
    `);

    // Create joint table between users and challenges
    await client.query(`CREATE TABLE IF NOT EXISTS usersChallenges(
                  id SERIAL PRIMARY KEY,
                  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                  challenge_id INT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
                  recipe_id INT UNIQUE,
                  liked BOOLEAN DEFAULT false,
                  status challenge_status DEFAULT 'participating',
                  CONSTRAINT unique_user_challenge UNIQUE (user_id, challenge_id)
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS recipelikes(
                  recipe_id INT NOT NULL,
                  user_id INT NOT NULL,
                  PRIMARY KEY (recipe_id, user_id),
                  CONSTRAINT fk_likes_users FOREIGN KEY (user_id) REFERENCES users (id)
    );`);
                  // CONSTRAINT fk_likes_recipes FOREIGN KEY (recipe_id) REFERENCES recipes (id),
                  // NOTE: This constraint would be added when user-created recipe IDs and MealDB recipe IDs no longer collide!

    await client.end();
}

seedDatabase()
