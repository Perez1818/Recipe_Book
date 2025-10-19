const usersTable = require("../database/usersTable.js");
const { validate, validationResult } = require("../middleware/formValidation.js");
const { passport } = require("../middleware/passport.js");
const { getSingleUpload } = require("../middleware/fileUploader.js");
const { getErrorMessages, attributeCount } = require("../middleware/helpers.js");
const { sendVerificationEmail } = require("../middleware/emailVerification.js");

const PARENT_DIRECTORY = __dirname;
const UPLOADS_DIRECTORY = `${PARENT_DIRECTORY}/../public/uploads`;
const AVATAR_DIRECTORY = `${UPLOADS_DIRECTORY}/avatar`;
const AVATAR_FIELD_NAME = "avatar";

const uploadSingleAvatar = getSingleUpload(AVATAR_DIRECTORY, AVATAR_FIELD_NAME);

exports.getIndex = async (request, response) => {
    response.redirect("/static/index.html");
};

exports.getSignUp = async (request, response) => {
    response.render("signup");
};

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
                // response.redirect("/login");

                const user = await usersTable.getUserByName(request.body.username);
                await sendVerificationEmail(user.email, user.id);
                response.render("signup", { successMessage: "User successfully registered. Check your email to verify." });
            }
            else {
                next();
            }
        }
    }
];

exports.verifyUser = async (request, response) => {
    const { userId } = request.params;

    const user = await usersTable.getUserById(userId);
    if (!user) {
        return response.status(400).send("Invalid verification link");
    }
    else {
        usersTable.verifyUser(userId);
        response.redirect("/login?verified=1");
    }
};

exports.getLogin = async (request, response) => {
    const failedLoginAttempt = (request.query.failed === "1");
    if (failedLoginAttempt) {
        response.render("login", { errorMessages: { credentials: "Login failed. Please try again." } });
    }
    else {
        response.render("login");
    }
};

exports.loginUser = passport.authenticate("local", { successRedirect: "/", failureRedirect: "/login?failed=1" });

exports.logoutUser = (request, response, next) => {
    request.logout((error) => {
        if (error) {
            return next(error);
        }
        response.redirect("/login");
    });
};

exports.getUserProfile = async (request, response, next) => {
    const user = await usersTable.getUserByName(request.params.username);
    if (user) {
        const userRecipes = await usersTable.getUserRecipes(user.id);
        response.render("profile", { user: user, userRecipes: userRecipes });
    }
    else {
        response.redirect("/");
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
        uploadSingleAvatar(request, response, async (error) => {
            await validate.avatarUpload(request);
            await validate.usernameUpdate(request);

            const user = request.user;
            if (user) {
                const result = validationResult(request);
                const errorMessages = getErrorMessages(result);
                
                if (attributeCount(errorMessages)) {
                    const invalidUser = { username: request.body.username, biography: request.body.biography };
                    response.render("edit-profile", { errorMessages: errorMessages, invalidUser: invalidUser });
                }

                else {
                    await usersTable.updateUsername(request.user.id, request.body.username);
                    await usersTable.updateBiography(request.user.id, request.body.biography);

                    if (request.file !== undefined) {
                        await usersTable.updateAvatar(request.user.id, request.file.filename);
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

exports.updateAccount = [
        validate.emailUpdate(),
        validate.passwordUpdate(),
        validate.confirmedPassword(),
        validate.currentPassword(),
        validate.birthday(),

        async (request, response, next) => {
            const user = request.user;
            if (user) {
                const result = validationResult(request);
                const errorMessages = getErrorMessages(result);

                if (attributeCount(errorMessages)) {
                    const invalidUser = {
                        email: request.body.email,
                        birthday: request.body.birthday
                    };
                    response.render("edit-account", { errorMessages: errorMessages, invalidUser: invalidUser });
                }
                else {
                    await usersTable.updateEmail(request.user.id, request.body.email);
                    if (request.body.password) {
                        await usersTable.updatePassword(request.user.id, request.body.password);
                    }
                    if (request.body.birthday) {
                        await usersTable.updateBirthday(request.user.id, request.body.birthday);
                    }

                    response.redirect("/settings/account");
                }
            }
            else {
                next();
            }
    }
];
