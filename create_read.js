require("dotenv").config();
const { Client } = require("pg");

// NOTE: Create the variable DATABASE_CONNECTION_STRING in your ".env" file
const client = new Client({
    connectionString: process.env.DATABASE_CONNECTION_STRING,
});

async function main() {
    await client.connect();

    await client.query(`CREATE TABLE IF NOT EXISTS USERS(
                        ID SERIAL PRIMARY KEY,
                        NAME TEXT
                        )`);

    await client.query(`INSERT INTO USERS (NAME) VALUES ($1)`, ["Tyrese_wuz_here"]);

    const response = await client.query("SELECT * FROM USERS");
    console.log("Objects found:", response.rows);

    await client.end();
}

main().catch(console.error);