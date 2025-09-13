const express = require("express");
const dotenv = require("dotenv");
const path = require("node:path");
const { body, validationResult } = require("express-validator");
const { pool, getUser, getUserById, addUser } = require("./database/query.js");

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const CURRENT_WORKING_DIRECTORY = __dirname;
const PROJECT_TITLE = "Recipe Book";
const STATIC_FOLDER = `${CURRENT_WORKING_DIRECTORY}/public`

const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 5;

dotenv.config({ path: `${CURRENT_WORKING_DIRECTORY}/.env` });
const SERVER_PORT = process.env.SERVER_PORT;

const app = express();

app.use(session({ secret: process.env.EXPRESS_SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.session());

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await getUser(username, password);

            if (!user) {
              return done(null, false, { message: "Incorrect username" });
            }
            if (user.password !== password) {
              return done(null, false, { message: "Incorrect password" });
            }

            return done(null, user);
        }
        catch(error) {
            return done(error);
        }
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await getUserById(id);
        done(null, user);
    }
    catch(error) {
        done(error);
    }
});

app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static(`${CURRENT_WORKING_DIRECTORY}/public`));

const validate = {
    username: () => body("username")
                      .notEmpty().withMessage("Username is required")
                      .isLength({ min: MIN_USERNAME_LENGTH }).withMessage(`Username must be at least ${MIN_USERNAME_LENGTH} characters long`)
                      .isAlphanumeric().withMessage("Username must contain only letters and numbers"),

    email: () => body("email")
                   .notEmpty().withMessage("Email is required")
                   .isEmail().withMessage("Please enter a valid email"),

    password: () => body("password")
                      .notEmpty().withMessage("Password is required")
                      .isLength({ min: MIN_PASSWORD_LENGTH }).withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`),

    confirmedPassword: async (request) => await body("confirmedPassword")
                                                  .equals(request.body.password).withMessage("Passwords do not match")
                                                  .run(request)
};

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
    const result = await pool.query("SELECT * FROM users");
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
        const userCreated = await addUser(request.body.username, request.body.email, request.body.password);
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
});
