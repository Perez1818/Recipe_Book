const express = require("express");
const app = express();
app.set("view engine", "ejs");
/* Explicitly specify "views" path */
app.set("views", "./views");
/* Serve static files (HTML, CSS, Javascript, etc.) */
app.use(express.static("public"));

require("dotenv").config();
const { Client } = require("pg");
const client = new Client({
    connectionString: process.env.DATABASE_CONNECTION_STRING,
});

async function main() {
    app.use(express.json());
    await client.connect();

    app.get("/", (request, response) => {
        response.render("index");
    });

    app.get("/users", async(request, response) => {
        try {
            // result.rows format = [json_object1, json_object2, ...]
            // json_object format = {"id": 1, "name": "string"}
            const result = await client.query("SELECT * FROM users");
            // response.json(result.rows);
            response.render("users", {users : result.rows});
        } catch (error) {
            console.error(error);
            response.status(500).send("Server Error");
        }
    });

    const SERVER_PORT = process.env.SERVER_PORT;
    app.listen(SERVER_PORT, () => {
        console.log(`Server running on http://localhost:${SERVER_PORT}`);
    });
    // await client.end();
}

main().catch(console.error);
