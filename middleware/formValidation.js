const { body, validationResult } = require("express-validator");
const usersTable = require("../database/usersTable.js");

const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 5;

const validate = {
    username: () => body("username")
                      .notEmpty().withMessage("Username is required")
                      .isLength({ min: MIN_USERNAME_LENGTH }).withMessage(`Username must be at least ${MIN_USERNAME_LENGTH} characters long`)
                      .isAlphanumeric().withMessage("Username must contain only letters and numbers")
                      .custom(async username => {
                          const usernameIsAvailable = await usersTable.usernameIsAvailable(username);
                          if (!usernameIsAvailable) {
                              throw new Error("Username already in use");
                          }
                      }),

    email: () => body("email")
                   .notEmpty().withMessage("Email is required")
                   .isEmail().withMessage("Please enter a valid email")
                   .custom(async email => {
                       const emailIsAvailable = await usersTable.emailIsAvailable(email);
                       if (!emailIsAvailable) {
                           throw new Error("Email already in use");
                       }
                   }),

    password: () => body("password")
                      .notEmpty().withMessage("Password is required")
                      .isLength({ min: MIN_PASSWORD_LENGTH }).withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`),

    confirmedPassword: () => body("confirmedPassword")
                               .custom(async (password, { req }) => {
                                   if (password !== req.body.password) {
                                       throw new Error("Passwords do not match");
                                   }
                               }),

    usernameUpdate: async (request) => await body("username")
                      .notEmpty().withMessage("Username is required")
                      .isLength({ min: MIN_USERNAME_LENGTH }).withMessage(`Username must be at least ${MIN_USERNAME_LENGTH} characters long`)
                      .isAlphanumeric().withMessage("Username must contain only letters and numbers")
                      .custom(async (username, { req }) => {
                          const usernameIsAvailable = await usersTable.usernameIsAvailable(username);
                          if (!usernameIsAvailable && req.user.username !== username) {
                              throw new Error("Username already in use");
                          }
                      }).run(request),

    emailUpdate: () => body("email")
                         .notEmpty().withMessage("Email is required")
                         .isEmail().withMessage("Please enter a valid email")
                         .custom(async (email, { req }) => {
                             const emailIsAvailable = await usersTable.emailIsAvailable(email);
                             if (!emailIsAvailable && req.user.email !== email) {
                                 throw new Error("Email already in use");
                             }
                         }),

    birthday: () => body("birthday")
                      .custom(async birthday => {
                          if (birthday !== "") {
                              const currentDate = new Date();
                              const birthDate = new Date(birthday);
                              if (birthDate >= currentDate) {
                                  throw new Error("Birthday cannot be in the future");
                              }
                          }
                      })
};

module.exports = {
    validate,
    validationResult
}
