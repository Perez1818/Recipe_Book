const express = require("express");
const router = require("./routes/router.js");
const dotenv = require("dotenv");

const recipesRouter = require("./routes/recipesRouter.js");
const worldRouter = require("./routes/worldRouter.js");

const sessionMiddleware = require("./middleware/session.js");
const { passport, configurePassport } = require("./middleware/passport.js");

const PARENT_DIRECTORY = __dirname;

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

app.use(express.json({ limit: "1mb" }));

// Routes
app.use("/recipes", recipesRouter);
app.use("/world", worldRouter);
app.use("/", router);

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
