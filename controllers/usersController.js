const usersTable = require("../database/usersTable.js");
const { validate, validationResult } = require("../middleware/formValidation.js");
const { passport } = require("../middleware/passport.js");
const { getSingleUpload } = require("../middleware/fileUploader.js");
const { getErrorMessages, attributeCount } = require("../middleware/helpers.js");
const { sendVerificationEmail } = require("../middleware/emailVerification.js");
const jwt = require("jsonwebtoken");

const PARENT_DIRECTORY = __dirname;
const UPLOADS_DIRECTORY = `${PARENT_DIRECTORY}/../public/uploads`;
const AVATAR_DIRECTORY = `${UPLOADS_DIRECTORY}/avatar`;
const AVATAR_FIELD_NAME = "avatar";

const uploadSingleAvatar = getSingleUpload(AVATAR_DIRECTORY, AVATAR_FIELD_NAME);

exports.getIndex = async (request, response) => {
    response.redirect("/static/index.html");
};

exports.getSignUp = async (request, response) => {
    const user = request.user;
    if (user) {
        response.redirect("/");
    }
    else {
        response.render("signup");
    }
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
                await sendVerificationEmail(user.id, user.email);
                response.render("signup", { successMessage: "User successfully registered. Check your email to verify." });
            }
            else {
                next();
            }
        }
    }
];

exports.verifyUser = async (request, response, next) => {
    const { token } = request.query;
    try {
        const decodedToken = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET);
        const id = decodedToken.id;
        const email = decodedToken.email;
        await usersTable.verifyUser(id, email);

        if (!request.user) {
            return response.redirect("/login?verified=1");
        }
        if (String(request.user.id) === String(id)) {
            return response.redirect("/settings/account?verified=1");
        }
        return request.logout((error) => {
            if (error) { return next(error); }
            response.redirect("/login?verified=1");
        });
    }
    catch (error) {
        if (!request.user) {
            response.redirect("/login?verified=0");
        }
        else {
            response.redirect("/settings/account?verified=0");
        }
    }
};

exports.getLogin = async (request, response) => {
    if (request.user) {
        return response.redirect("/");
    }

    const { verified, loggedOut } = request.query;
    if (loggedOut === "1") {
        return response.render("login", { successMessage: "You've been logged out." });
    }
    if (verified === "1") {
        response.render("login", { successMessage: "Email successfully verified. You may now log in." });
    }
    else if (verified === "0") {
        response.render("login", { errorMessages: { credentials: "Verification link is invalid or expired. Request a new one." } });
    }
    else {
        response.render("login");
    }

};

exports.loginUser = (request, response, next) => {
    passport.authenticate("local", (error, user, info) => {
        if (error) {
            return next(error);
        }
        if (!user) {
            response.render("login", { errorMessages: { credentials: info.message } });
        }
        else {
            request.logIn(user, (error) => {
                if (error) {
                    return next(error);
                }
                response.redirect("/");
            });
        }
    })(request, response, next);
}

exports.logoutUser = (request, response, next) => {
    request.logout((error) => {
        if (error) {
            return next(error);
        }
        response.redirect("/login?loggedOut=1");
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
        /* NOTE: Could add redirection back to profile after successful sign in */
        response.redirect("/login");
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
    if (!request.user) {
        return response.redirect("/login");
    }

    const { verified } = request.query;
    if (verified === "1") {
        response.render("edit-account", { successMessage: "Email successfully changed." });
    }
    else if (verified === "0") {
        response.render("edit-account", { errorMessages: { credentials: "Verification link is invalid or expired. Request a new one." } });
    }
    else {
        response.render("edit-account");
    }
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
                    if (request.user.email !== request.body.email) {
                        await sendVerificationEmail(request.user.id, request.body.email);
                    }
                    if (request.body.password) {
                        await usersTable.updatePassword(request.user.id, request.body.password);
                    }
                    if (request.body.birthday) {
                        await usersTable.updateBirthday(request.user.id, request.body.birthday);
                    }

                    response.render("edit-account", { successMessage: `Confirmation sent to ${request.body.email}.` } );
                }
            }
            else {
                next();
            }
    }
];

// Obtains the ID, username, and avatar of the current user (if they're logged in)
exports.getCurrentUser = async (request, response) => {
    if (!request.user) {
        return response.status(401).json({ error: "Not logged in" });
    }
    response.json({
        id: request.user.id,
        username: request.user.username,
        avatar: request.user.avatar ? `../uploads/avatar/${request.user.avatar}` : null
    });
}

// Provided a user ID, retreives username and avatar
exports.getUserDetailsById = async (request, response) => {
    const id = Number(request.params.id);
    if (!id) {
        return response.status(400).json({ error: 'Number ID required' })
    }
    const userDetails = await usersTable.getUserById(id);
    if (!userDetails) {
        return res.status(404).json({ error: "User not found" });
    }
    response.json({
        username: userDetails.username,
        avatar: userDetails.avatar ? `../uploads/avatar/${userDetails.avatar}` : null
    });
}

exports.listUsers = async (req, res) => {
    try {
        const users = await usersTable.listUsers();
        res.json({ users });
    } catch (err) {
        console.error("listUsers error:", err);
        res.status(500).json({ error: "failed_to_list_users" });
    }
};

exports.followUser = async (req, res) => { // from follow-user-old branch
    const actor = req.user?.id;
    const target = Number(req.params.id);
    if (!actor) return res.status(401).json({ error: 'not_authenticated' });
    if (!target || actor === target) return res.status(400).json({ error: 'invalid_target' });

    const ok = await usersTable.followUser(actor, target);
    if (!ok) return res.status(500).json({ error: 'follow_failed' });
    return res.json({ message: 'followed', id: target });
};

// DELETE /users/:id/follow
exports.unfollowUser = async (req, res) => { // from follow-user-old branch
    const actor = req.user?.id;
    const target = Number(req.params.id);
    if (!actor) return res.status(401).json({ error: 'not_authenticated' });
    if (!target || actor === target) return res.status(400).json({ error: 'invalid_target' });

    const ok = await usersTable.unfollowUser(actor, target);
    if (!ok) return res.status(500).json({ error: 'unfollow_failed' });
    return res.json({ message: 'unfollowed', id: target });
};

// GET /users/:id/followers
exports.getFollowers = async (req, res) => { // from follow-user-old branch
    const target = Number(req.params.id);
    if (!target) return res.status(400).json({ error: 'invalid_target' });
    const rows = await usersTable.getFollowers(target);
    return res.json({ items: rows });
};

// GET /users/:id/following
exports.getFollowing = async (req, res) => { // from follow-user-old branch
    const target = Number(req.params.id);
    if (!target) return res.status(400).json({ error: 'invalid_target' });
    const rows = await usersTable.getFollowing(target);
    return res.json({ items: rows });
};

exports.isFollowing = async (req, res) => { // from follow-user branch-old
  const actor = req.user?.id;
  const target = Number(req.params.id);
  if (!target) return res.status(400).json({ error: 'invalid_target' });
  if (!actor) return res.json({ isFollowing: false }); // not logged in => not following
  try {
    const ok = await usersTable.isFollowing(Number(actor), target);
    return res.json({ isFollowing: !!ok });
  } catch (e) {
    console.error('isFollowing error', e);
    return res.status(500).json({ error: 'server_error' });
  }
};
