const upload = require("../middleware/fileUploader.js");

exports.getUploader = (request, response) => {
    response.render("upload");
}

exports.uploadAvatar = [
    upload.single("avatar"),

    (request, response, next) => {
        if (request.file !== undefined) {
            response.send("Avatar received");
        }
        else {
            response.render("upload");
        }
    }
];
