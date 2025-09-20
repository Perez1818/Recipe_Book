const multer = require("multer");
const PARENT_DIRECTORY = __dirname;
const upload = multer({ dest: `${PARENT_DIRECTORY}/../public/uploads/` });

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
