const express = require("express");
const dotenv = require("dotenv");
const db = require("./database/query.js");
const { validate, validationResult } = require("./middleware/formValidation.js");

const sessionMiddleware = require("./middleware/session.js");
const { passport, configurePassport } = require("./middleware/passport.js");

const PARENT_DIRECTORY = __dirname;
const PROJECT_TITLE = "Recipe Book";

dotenv.config({ path: `${PARENT_DIRECTORY}/.env` });
const SERVER_PORT = process.env.SERVER_PORT;

const app = express();

app.use(sessionMiddleware());
app.use(passport.session());
configurePassport();

// Make user object accessible in all views
app.use((request, response, next) => {
    response.locals.currentUser = request.user;
    next();
});

app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.set("views", `${PARENT_DIRECTORY}/views`);     /* https://stackoverflow.com/a/41055903 */
app.use("/static", express.static(`${PARENT_DIRECTORY}/public`));

function getErrorMessages(result) {
    const errors = result.array({ onlyFirstError: true });

    const errorMessages = {};

    for (let error of errors) {
        let fieldName = error.path;
        let errorMessage = error.msg;
        errorMessages[fieldName] = errorMessage;
    }
    
    return errorMessages;
}

function attributeCount(object) {
    return Object.keys(object).length;
}

app.get("/", (request, response) => {
    response.render("index", { browserTitle: PROJECT_TITLE, pageTitle: PROJECT_TITLE });
});

app.get("/users", async (request, response) => {
    const result = await db.pool.query("SELECT * FROM users");
    response.render("users", { users : result.rows });
});

app.get("/recipes", async (request, response) => {
    response.render("recipes");
});

app.get("/signup", async (request, response) => {
    response.render("signup");
});

app.post("/signup", validate.username(), validate.email(), validate.password(), async (request, response) => {
    await validate.confirmedPassword(request);
    const result = validationResult(request);
    const errorMessages = getErrorMessages(result);

    if (attributeCount(errorMessages)) {
        response.render("signup", { errorMessages: errorMessages });
    }
    else {
        const userCreated = await db.createUser(request.body.username, request.body.email, request.body.password);
        if (userCreated) {
            response.redirect("/");
        }
        else {
            response.render("signup", { errorMessages: { unavailable: "Username or email is unavailable or already taken, please try another" } });
        }
    }
});

app.get("/login", async (request, response) => {
    const failedLoginAttempt = (request.query.failed === "1");
    if (failedLoginAttempt) {
        response.render("login", { errorMessages: { credentials: "Login failed. Please try again." } });
    }
    else {
        response.render("login");
    }
});

app.post("/login", passport.authenticate("local", { successRedirect: "/users", failureRedirect: "/login?failed=1" }));

app.get("/logout", (request, response, next) => {
    request.logout((error) => {
        if (error) {
            return next(error);
        }
        response.redirect("/");
    });
});

app.post("/api/recipes", async (request, response) => {
    const recipe = request.body;
    await db.pool.query(`INSERT INTO RECIPES (NAME, DESCRIPTION, INGREDIENTS, COOK_TIME, TAGS) VALUES ($1, $2, $3, $4, $5)`, [recipe.name, recipe.description, recipe.ingredients, recipe.cookTime, recipe.tags]);
    response.send(recipe);
});

app.get("/api/recipes", async (request, response) => {
    const result = await db.pool.query("SELECT * FROM recipes");
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
});
