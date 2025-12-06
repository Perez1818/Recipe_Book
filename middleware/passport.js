const usersTable = require("../database/usersTable.js");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

function configurePassport() {
    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const user = await usersTable.getUserByNameOrEmail(username);

                if (!user) {
                  return done(null, false, { message: "Login failed. Please try again." });
                }

                const passwordsMatch = await usersTable.comparePasswords(password, user.password);
                if (!passwordsMatch) {
                  return done(null, false, { message: "Login failed. Please try again." });
                }

                if (!user.is_verified) {
                  return done(null, false, { message: "Login failed. Please verify email." });
                }

                return done(null, user);
            }
            catch(error) {
                console.log(error);
                return done(error);
            }
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await usersTable.getUserById(id);
            done(null, user);
        }
        catch(error) {
            console.log(error);
            done(error);
        }
    });
}

module.exports = {
    passport,
    configurePassport
}
