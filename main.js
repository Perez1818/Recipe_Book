const express = require("express");
const app = express();
/* Serve static files (HTML, CSS, Javascript, etc.) */
app.use(express.static("public"));

require("dotenv").config();
const { Client } = require("pg");
const client = new Client({
    connectionString: process.env.DATABASE_CONNECTION_STRING,
});


async function main() {
    app.use(express.json());

    app.get("/", (request, response) => {
        response.send("Recipe Book");
    });

    app.get("/users", async(request, response) => {
        try {
            await client.connect();
            const result = await client.query("SELECT * FROM users");
            response.json(result.rows);
            await client.end();
        } catch (error) {
            console.error(error);
            response.status(500).send("Server Error");
        }
    });

    const SERVER_PORT = process.env.SERVER_PORT;
    app.listen(SERVER_PORT, () => {
        console.log(`Server running on http://localhost:${SERVER_PORT}`);
    });
}

main().catch(console.error);
