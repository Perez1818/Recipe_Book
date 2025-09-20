const getCustomUpload = require("../middleware/fileUploader.js");

const PARENT_DIRECTORY = __dirname;
const UPLOADS_DIRECTORY = `${PARENT_DIRECTORY}/../public/uploads`;
const BYTES_PER_MEGABYTE = 1024 * 1024;

const ALLOWED_AVATAR_FILE_TYPES = ["png", "jpg", "jpeg"];
const AVATAR_DIRECTORY = `${UPLOADS_DIRECTORY}/avatar`;
const BYTES_PER_AVATAR = BYTES_PER_MEGABYTE;
const AVATAR_FIELD_NAME = "avatar";

const uploadSingleAvatar = getCustomUpload(ALLOWED_AVATAR_FILE_TYPES, AVATAR_DIRECTORY, BYTES_PER_AVATAR, AVATAR_FIELD_NAME);

exports.getUploader = (request, response) => {
    if (request.isAuthenticated()) {
        response.render("upload");
    }
    else {
        response.render("login");
    }
}

exports.uploadAvatar = [
    uploadSingleAvatar,

    (request, response, next) => {
        if (request.file !== undefined) {
            response.send("Avatar received");
        }
        else {
            response.render("upload");
        }
    }
];
