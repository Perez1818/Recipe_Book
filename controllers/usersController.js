const usersTable = require("../database/usersTable.js");
const { validate, validationResult } = require("../middleware/formValidation.js");
const { passport } = require("../middleware/passport.js");

exports.getSignUp = async (request, response) => {
    response.render("signup");
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

exports.signUpUser = [
    validate.username(),
    validate.email(),
    validate.password(),

    async (request, response) => {
        await validate.confirmedPassword(request);
        const result = validationResult(request);
        const errorMessages = getErrorMessages(result);

        if (attributeCount(errorMessages)) {
            response.render("signup", { errorMessages: errorMessages });
        }
        else {
            const userCreated = await usersTable.createUser(request.body.username, request.body.email, request.body.password);
            if (userCreated) {
                response.redirect("/");
            }
            else {
                response.render("signup", { errorMessages: { unavailable: "Username or email is unavailable or already taken, please try another" } });
            }
        }
    }
];

exports.getLogin = async (request, response) => {
    const failedLoginAttempt = (request.query.failed === "1");
    if (failedLoginAttempt) {
        response.render("login", { errorMessages: { credentials: "Login failed. Please try again." } });
    }
    else {
        response.render("login");
    }
};

exports.loginUser = passport.authenticate("local", { successRedirect: "/users", failureRedirect: "/login?failed=1" });

exports.logoutUser = (request, response, next) => {
    request.logout((error) => {
        if (error) {
            return next(error);
        }
        response.redirect("/");
    });
};
