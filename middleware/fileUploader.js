const multer = require("multer");
const mime = require("mime-types");
const crypto = require("crypto");

const PARENT_DIRECTORY = __dirname;
const BYTES_PER_MEGABYTE = 1024 * 1024;
const NUM_FILES_ACCEPTED = 1;

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

const storage = multer.diskStorage({
    destination: `${PARENT_DIRECTORY}/../public/uploads/avatar`,
    /* https://github.com/expressjs/multer/blob/main/storage/disk.js */
    filename: (request, file, callback) => {
        crypto.randomBytes(16, (error, raw) => {
            const extension = mime.extension(file.mimetype);
            const fileName = raw.toString("hex") + "." + extension;
            callback(error, error ? undefined : fileName)
        })
    }
});

const limits = { fileSize: BYTES_PER_MEGABYTE, files: NUM_FILES_ACCEPTED };

const upload = multer({ 
    storage: storage,
    limits: limits,
    fileFilter: fileFilter
});

module.exports = upload;
