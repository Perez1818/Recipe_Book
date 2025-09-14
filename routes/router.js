const { Router } = require("express");
const db = require("../database/query.js");
const { validate, validationResult } = require("../middleware/formValidation.js");
const { passport } = require("../middleware/passport.js");

const PROJECT_TITLE = "Recipe Book";

const router = Router();

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

router.get("/", (request, response) => {
    response.render("index", { browserTitle: PROJECT_TITLE, pageTitle: PROJECT_TITLE });
});

router.get("/users", async (request, response) => {
    const result = await db.pool.query("SELECT * FROM users");
    response.render("users", { users : result.rows });
});

router.get("/recipes", async (request, response) => {
    response.render("recipes");
});

router.get("/signup", async (request, response) => {
    response.render("signup");
});

router.post("/signup", validate.username(), validate.email(), validate.password(), async (request, response) => {
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

router.get("/login", async (request, response) => {
    const failedLoginAttempt = (request.query.failed === "1");
    if (failedLoginAttempt) {
        response.render("login", { errorMessages: { credentials: "Login failed. Please try again." } });
    }
    else {
        response.render("login");
    }
});

router.post("/login", passport.authenticate("local", { successRedirect: "/users", failureRedirect: "/login?failed=1" }));

router.get("/logout", (request, response, next) => {
    request.logout((error) => {
        if (error) {
            return next(error);
        }
        response.redirect("/");
    });
});

router.post("/api/recipes", async (request, response) => {
    const recipe = request.body;
    await db.pool.query(`INSERT INTO RECIPES (NAME, DESCRIPTION, INGREDIENTS, COOK_TIME, TAGS) VALUES ($1, $2, $3, $4, $5)`, [recipe.name, recipe.description, recipe.ingredients, recipe.cookTime, recipe.tags]);
    response.send(recipe);
});

router.get("/api/recipes", async (request, response) => {
    const result = await db.pool.query("SELECT * FROM recipes");
    response.send(result.rows);
});

module.exports = router;
