const multer = require("multer");
const mime = require("mime-types");
const crypto = require("crypto");

const NUM_FILES_ACCEPTED = 1;

function stringArrayToSentence(stringArray) {
    if (stringArray.length >= 2) {
        return stringArray.slice(0, -1).join(", ") + " and " + stringArray.at(-1);
    }
    return stringArray.join(", ");
}

function getCustomUpload(allowedFileTypes, destinationFolder, bytesPerUpload, fieldName) {
    const fileFilter = (request, file, callback) => {
        const extension = mime.extension(file.mimetype);
        if (allowedFileTypes.includes(extension)) {
            callback(null, true);
        }
        else {
            callback(new Error(`Only ${stringArrayToSentence(allowedFileTypes)} files are permitted`));
        }
    }

    const storage = multer.diskStorage({
        destination: destinationFolder,

        /* https://github.com/expressjs/multer/blob/main/storage/disk.js */
        filename: (request, file, callback) => {
            crypto.randomBytes(16, (error, raw) => {
                const extension = mime.extension(file.mimetype);
                const fileName = raw.toString("hex") + "." + extension;
                callback(error, error ? undefined : fileName)
            })
        }
    });

    const limits = { fileSize: bytesPerUpload, files: NUM_FILES_ACCEPTED };

    const upload = multer({ 
        storage: storage,
        limits: limits,
        fileFilter: fileFilter
    });
    
    return upload.single(fieldName);
}

module.exports = getCustomUpload;
