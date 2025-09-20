const multer = require("multer");
const PARENT_DIRECTORY = __dirname;
const mime = require("mime-types");

const BYTES_PER_MEGABYTE = 1024 * 1024;
const NUM_FILES_ACCEPTED = 1;

const storage = multer.diskStorage({
    destination: `${PARENT_DIRECTORY}/../public/uploads/avatar`,
    filename: (request, file, callback) => {
        const extension = mime.extension(file.mimetype);
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        callback(null, file.fieldname + "-" + uniqueSuffix + "." + extension);
    }
});

const fileFilter = (request, file, callback) => {
    const allowedFileTypes = ["png", "jpg", "jpeg"];
    const extension = mime.extension(file.mimetype);
    if (allowedFileTypes.includes(extension)) {
        callback(null, true);
    }
    else {
        callback(new Error(`Only ${allowedFileTypes.join(", ")} are allowed.`));
    }
}

const upload = multer({ 
    storage: storage,
    limits: { fileSize: BYTES_PER_MEGABYTE, files: NUM_FILES_ACCEPTED },
    fileFilter: fileFilter
});

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
