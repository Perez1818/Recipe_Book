const db = require("../database/query.js");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

function configurePassport() {
    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const user = await db.getUserByNameOrEmail(username);

                if (!user) {
                  return done(null, false, { message: "Incorrect username" });
                }

                const passwordsMatch = await db.comparePasswords(password, user.password);
                if (!passwordsMatch) {
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
            const user = await db.getUserById(id);
            done(null, user);
        }
        catch(error) {
            done(error);
        }
    });
}

module.exports = {
    passport,
    configurePassport
}
