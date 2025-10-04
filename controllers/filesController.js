const { getCustomUpload, getMultiUpload, getInvalidFileMessage } = require("../middleware/fileUploader.js");
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

exports.uploadAvatar = async (request, response) => {
    uploadSingleAvatar(request, response, async (error) => {
        if (error) {
            const message = error.code === "LIMIT_FILE_SIZE" ? `File size cannot exceed ${BYTES_PER_AVATAR / BYTES_PER_MEGABYTE}MB` : error.message;
            response.render("avatar", { errorMessage: message });
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

exports.getMultimediaUpload = async (request, response) => {
    if (request.isAuthenticated()) {
        response.render("multimedia");
    }
    else {
        response.render("login");
    }
}

exports.uploadMultimedia = [
    getMultiUpload(),
    async (request, response) => {
        console.log(request.files);
        const photoFile = "photo" in request.files ? request.files["photo"][0] : null;
        const videoFile = "video" in request.files ? request.files["video"][0] : null;

        let photoName = "";
        let videoName = "";

        let photoErrorMessage = "";
        let videoErrorMessage ="";

        if (photoFile) {
            photoErrorMessage = getInvalidFileMessage(photoFile);
            if (!photoErrorMessage) {
                photoName = photoFile.filename;
            }
        }

        if (videoFile) {
            videoErrorMessage = getInvalidFileMessage(videoFile);
            if (!videoErrorMessage) {
                videoName = videoFile.filename
            }
        }
        
        console.log(request.files);

        response.render("multimedia", { photoErrorMessage: photoErrorMessage, videoErrorMessage: videoErrorMessage, photoName: photoName, videoName: videoName });
    }
]
