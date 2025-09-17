const { body, validationResult } = require("express-validator");

const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 5;

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

module.exports = {
    validate,
    validationResult
}
