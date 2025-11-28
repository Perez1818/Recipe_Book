const { body, validationResult } = require("express-validator");
const usersTable = require("../database/usersTable.js");
const { stringArrayToSentence } = require("./fileUploader.js");
const { deleteFile, deleteFiles, getCurrentDateWithoutTime } = require("./helpers.js");
const mime = require("mime-types");

const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 5;

const ALLOWED_AVATAR_FILE_TYPES = ["png", "jpg", "jpeg"];
const ALLOWED_THUMBNAIL_FILE_TYPES = ALLOWED_AVATAR_FILE_TYPES;
const ALLOWED_VIDEO_FILE_TYPES = ["mp4"];

const BYTES_PER_MEGABYTE = 1024 * 1024;
const BYTES_PER_AVATAR = BYTES_PER_MEGABYTE;
const BYTES_PER_THUMBNAIL = 1 * BYTES_PER_MEGABYTE;
const BYTES_PER_VIDEO = 2 * BYTES_PER_MEGABYTE;

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
                      }),

    passwordUpdate: () => body("password")
                            .custom(async password => {
                                if (password.length < MIN_PASSWORD_LENGTH && password.length !== 0) {
                                    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
                                }
                            }),

    currentPassword: () => body("currentPassword")
                             .custom(async (password, { req }) => {
                                 if (req.body.password && !(await usersTable.comparePasswords(password, req.user.password))) {
                                     throw new Error("Current password does not match our records");
                                 }
                             }),

    avatarUpload: async (request) => body("file")
                          .custom(async (unused, { req }) => {
                              const file = req.file;
                              if (!file) {
                                  return;
                              }
                              const extension = mime.extension(file.mimetype);
                              if (!ALLOWED_AVATAR_FILE_TYPES.includes(extension)) {
                                  deleteFile(file.path);
                                  throw new Error(`Only ${stringArrayToSentence(ALLOWED_AVATAR_FILE_TYPES)} files are permitted`);
                              }
                              if (file.size > BYTES_PER_AVATAR) {
                                  deleteFile(file.path);
                                  throw new Error(`File size cannot exceed ${BYTES_PER_AVATAR / BYTES_PER_MEGABYTE}MB`);
                              }
                          }).run(request),


    thumbnailVideoUpload: async (request) => body("file")
                                  .custom(async (unused, { req }) => {
                                      const files = req.files;

                                      const thumbnailArray = files["thumbnail"];
                                      const thumbnail = thumbnailArray ? thumbnailArray[0] : undefined;

                                      const videoArray = files["video"];
                                      const video = videoArray ? videoArray[0] : undefined;

                                      if (!thumbnail) {
                                          deleteFiles(thumbnailArray);
                                          deleteFiles(videoArray);
                                          throw new Error(`Thumbnail is required`);
                                      }

                                      const thumbnailExtension = mime.extension(thumbnail.mimetype);

                                      if (!ALLOWED_THUMBNAIL_FILE_TYPES.includes(thumbnailExtension)) {
                                          deleteFiles(thumbnailArray);
                                          deleteFiles(videoArray);
                                          throw new Error(`Only ${stringArrayToSentence(ALLOWED_THUMBNAIL_FILE_TYPES)} files are permitted for thumbnails`);
                                      }

                                      if (thumbnail.size > BYTES_PER_THUMBNAIL) {
                                          deleteFiles(thumbnailArray);
                                          deleteFiles(videoArray);
                                          throw new Error(`Thumbnail file size cannot exceed ${BYTES_PER_THUMBNAIL / BYTES_PER_MEGABYTE}MB`);
                                      }

                                      if (!video) {
                                          return;
                                      }

                                      const videoExtension = mime.extension(video.mimetype);

                                      if (!ALLOWED_VIDEO_FILE_TYPES.includes(videoExtension)) {
                                          deleteFiles(thumbnailArray);
                                          deleteFiles(videoArray);
                                          throw new Error(`Only ${stringArrayToSentence(ALLOWED_VIDEO_FILE_TYPES)} files are permitted for videos`);
                                      }

                                      if (video.size > BYTES_PER_VIDEO) {
                                          deleteFiles(thumbnailArray);
                                          deleteFiles(videoArray);
                                          throw new Error(`Video file size cannot exceed ${BYTES_PER_VIDEO / BYTES_PER_MEGABYTE}MB`);
                                      }
                                  }).run(request),

    challengeTitle: async (request) => body("title")
                                         .notEmpty().withMessage("Title is required")
                                         .run(request),

    challengeDescription: async (request) => body("description")
                                               .notEmpty().withMessage("Description is required")
                                               .run(request),

    challengeStart: async (request) => body("start")
                             .custom(async start => {
                                 if (start !== "") {
                                     const currentDate = getCurrentDateWithoutTime();
                                     const startDate = new Date(start);
                                     if (startDate < currentDate) {
                                         throw new Error("Start date cannot be set before the challenge is created");
                                     }
                                 }
                             }).run(request),

    challengeCutoff: async (request) => body("cutoff")
                             .notEmpty().withMessage("Cutoff date is required")
                             .custom(async (cutoff, { req }) => {
                                 const currentDate = getCurrentDateWithoutTime();

                                 const start = req.body.start;
                                 const startDate = (start === "") ? currentDate : new Date(start);

                                 const cutoffDate = new Date(cutoff);

                                 if (cutoffDate < currentDate) {
                                     throw new Error("End date cannot be set before today");
                                 }

                                 if (cutoffDate < startDate) {
                                     throw new Error("End date cannot be set before the start date");
                                 }
                             }).run(request),

    challengePoints: async (request) => body("points")
                             .isInt({ min: 0, max: 100 }).withMessage("Points must be an integer between 0 and 100")
                             .run(request),

    challengeRequiredIngredients: async (request) => body("required-ingredients")
                                          .custom(async ingredients => {
                                              if (false) {
                                                  throw new Error("... are invalid ingredients");
                                              }
                                          }).run(request),

    challengeMaxIngredients: async (request) => body("max-ingredients")
                                     .isInt({ gt: 0 }).withMessage("Max ingredients must be an integer greater than 0")
                                     .run(request)
};

module.exports = {
    validate,
    validationResult
}
