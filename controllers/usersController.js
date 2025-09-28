const usersTable = require("../database/usersTable.js");
const { validate, validationResult } = require("../middleware/formValidation.js");
const { passport } = require("../middleware/passport.js");

const filesController = require("../controllers/filesController.js");
const BYTES_PER_MEGABYTE = 1024 * 1024;
const BYTES_PER_AVATAR = BYTES_PER_MEGABYTE;

exports.getIndex = async (request, response) => {
    response.redirect("/static/index.html");
};

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
    validate.confirmedPassword(),

    async (request, response, next) => {
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
                next();
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

exports.getUserProfile = async (request, response, next) => {
    const user = await usersTable.getUserByName(request.params.username);
    if (user) {
        response.render("profile", { user: user });
    }
    else {
        next();
    }
};

exports.getUserSettings = async (request, response, next) => {
    const user = request.user;
    if (user) {
        response.render("edit-profile");
    }
    else {
        next();
    }
}

exports.updateProfile = [
        async (request, response, next) => {
            filesController.uploadSingleAvatar(request, response, async (error) => {
                await validate.usernameUpdate(request);
                const user = request.user;
                if (user) {
                    const result = validationResult(request);
                    const errorMessages = getErrorMessages(result);
                    
                    if (error) {
                        const message = error.code === "LIMIT_FILE_SIZE" ? `File size cannot exceed ${BYTES_PER_AVATAR / BYTES_PER_MEGABYTE}MB` : error.message;
                        errorMessages["file"] = message;
                    }

                    if (attributeCount(errorMessages)) {
                        const invalidUser = { username: request.body.username, biography: request.body.biography };
                        response.render("edit-profile", { errorMessages: errorMessages, invalidUser: invalidUser });
                    }

                    else {
                        await usersTable.updateUsername(request.user.id, request.body.username);
                        await usersTable.updateBiography(request.user.id, request.body.biography);

                        if (request.file !== undefined) {
                            const avatarUrl = `/static/uploads/avatar/${request.file.filename}`;
                            await usersTable.updateAvatar(request.user.id, avatarUrl);
                        }

                        response.redirect("/settings");
                    }
                }
                else {
                    next();
                }
        })
    }
];

exports.getAccountSettings = async (request, response, next) => {
    response.render("edit-account");
}

exports.updateAccount = async (request, response, next) => {
    const invalidUser = {
        email: request.body.email,
        password: request.body.password,
        confirmedPassword: request.body.confirmedPassword,
        currentPassword: request.body.currentPassword,
        birthday: request.body.birthday
    };

    console.log(invalidUser.email);
    console.log(invalidUser.password);
    console.log(invalidUser.confirmedPassword);
    console.log(invalidUser.currentPassword);
    console.log(invalidUser.birthday);

    response.render("edit-account", { invalidUser: invalidUser });
}
