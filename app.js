const express = require("express");
const dotenv = require("dotenv");
const path = require("node:path");
const { Pool } = require("pg");

const CURRENT_WORKING_DIRECTORY = __dirname;
const PROJECT_TITLE = "Recipe Book";
const STATIC_FOLDER = `${CURRENT_WORKING_DIRECTORY}/public`

dotenv.config({ path: `${CURRENT_WORKING_DIRECTORY}/.env` });
const SERVER_PORT = process.env.SERVER_PORT;

const app = express();
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static(`${CURRENT_WORKING_DIRECTORY}/public`));

const pool = new Pool({ connectionString: process.env.DATABASE_CONNECTION_STRING });

app.get("/", (request, response) => {
    response.render("index", { browserTitle: PROJECT_TITLE, pageTitle: PROJECT_TITLE });
});

app.get("/users", async (request, response) => {
    const result = await pool.query("SELECT * FROM users");
    response.render("users", { users : result.rows });
});

app.get("/recipes", async (request, response) => {
    response.render("recipes");
});

app.get("/signup", async (request, response) => {
    response.sendFile(`${STATIC_FOLDER}/signup.html`);
});

app.post("/signup", async (request, response) => {
    response.send(`Hello ${request.body.username}!`);
});

app.post("/api/recipes", async (request, response) => {
    const recipe = request.body;
    await pool.query(`INSERT INTO RECIPES (NAME, DESCRIPTION, INGREDIENTS, COOK_TIME, TAGS) VALUES ($1, $2, $3, $4, $5)`, [recipe.name, recipe.description, recipe.ingredients, recipe.cookTime, recipe.tags]);
    response.send(recipe);
});

app.get("/api/recipes", async (request, response) => {
    const result = await pool.query("SELECT * FROM recipes");
    response.send(result.rows);
});

app.use((error, request, response, next) => {
    console.error(error);
    response.status(500).send("Server Error");
});

app.listen(SERVER_PORT, (error) => {
    if (error) {
        throw error;
    }
    console.log(`App listening on port ${SERVER_PORT}`);
    pool.connect();
});
