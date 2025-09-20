const getCustomUpload = require("../middleware/fileUploader.js");
const usersTable = require("../database/usersTable.js");

const PARENT_DIRECTORY = __dirname;
const UPLOADS_DIRECTORY = `${PARENT_DIRECTORY}/../public/uploads`;
const BYTES_PER_MEGABYTE = 1024 * 1024;

const ALLOWED_AVATAR_FILE_TYPES = ["png", "jpg", "jpeg"];
const AVATAR_DIRECTORY = `${UPLOADS_DIRECTORY}/avatar`;
const BYTES_PER_AVATAR = BYTES_PER_MEGABYTE;
const AVATAR_FIELD_NAME = "avatar";

const uploadSingleAvatar = getCustomUpload(ALLOWED_AVATAR_FILE_TYPES, AVATAR_DIRECTORY, BYTES_PER_AVATAR, AVATAR_FIELD_NAME);

exports.getAvatarUpload = async (request, response) => {
    if (request.isAuthenticated()) {
        response.render("avatar");
    }
    else {
        response.render("login");
    }
}

exports.uploadAvatar = async (request, response, next) => {
    uploadSingleAvatar(request, response, async (error) => {
        if (error) {
            response.render("avatar", { errorMessage: error.message });
        }
        else {
            if (request.isAuthenticated() && request.file !== undefined) {
                const avatarUrl = `/static/uploads/avatar/${request.file.filename}`;
                await usersTable.updateAvatar(request.user.id, avatarUrl);
            }
            response.redirect("/upload/avatar");
        }
    })
}
