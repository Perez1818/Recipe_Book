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
    // Built-in middleware
    app.use(express.json());
    await client.connect();

    app.get("/", (req, res) => {
        res.render("index", { 
            browserTitle: "Recipe Book", 
            pageTitle: "Recipe Book" 
        });
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

    app.get("/recipes", async(request, response) => {
        try {
            /*
            const result = await client.query("SELECT * FROM recipes");
            response.render("recipes", {recipes : result.rows});
            */
            response.render("recipes");
        } catch (error) {
            console.error(error);
            response.status(500).send("Server Error");
        }
    });

    app.post("/api/recipes", async(request, response) => {
        try {
            // console.log("request", request.body);
            recipe = request.body;
            console.log(recipe);
            await client.query(`INSERT INTO RECIPES (NAME, DESCRIPTION, INGREDIENTS, COOK_TIME, TAGS) VALUES ($1, $2, $3, $4, $5)`, [recipe.name, recipe.description, recipe.ingredients, recipe.cookTime, recipe.tags]);
            response.send(request.body);
        } catch (error) {
            console.error(error);
            response.status(500).send("Server Error");
        }
    });

    app.get("/api/recipes", async(request, response) => {
        try {
            const result = await client.query("SELECT * FROM recipes");
            response.send(result.rows);
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
