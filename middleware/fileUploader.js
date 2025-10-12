const multer = require("multer");
const mime = require("mime-types");
const crypto = require("crypto");

const BYTES_PER_MEGABYTE = 1024 * 1024;

const PARENT_DIRECTORY = __dirname;
const UPLOADS_DIRECTORY = `${PARENT_DIRECTORY}/../public/uploads`;
const MULTIMEDIA_DIRECTORY = `${UPLOADS_DIRECTORY}/multimedia`;

/* https://github.com/expressjs/multer/blob/main/storage/disk.js */
const generateFileName = (request, file, callback) => {
    crypto.randomBytes(16, (error, raw) => {
        const extension = mime.extension(file.mimetype);
        const fileName = raw.toString("hex") + "." + extension;
        callback(error, error ? undefined : fileName)
    })
}


function stringArrayToSentence(stringArray) {
    if (stringArray.length >= 2) {
        return stringArray.slice(0, -1).join(", ") + " and " + stringArray.at(-1);
    }
    return stringArray.join(", ");
}

function getSingleUpload(destinationFolder, fieldName) {
    const storage = multer.diskStorage({
        destination: destinationFolder,
        filename: generateFileName
    });

    const upload = multer({ 
        storage: storage
    });
    
    return upload.single(fieldName);
}

function getInvalidFileMessage(file) {
    const ALLOWED_PHOTO_TYPES = ["png", "jpg", "jpeg"];
    const ALLOWED_VIDEO_TYPES = ["mp4"];
    const BYTES_PER_VIDEO = 25 * BYTES_PER_MEGABYTE;
    const BYTES_PER_PHOTO = 5 * BYTES_PER_MEGABYTE;

    let allowedFileTypes;
    switch(file.fieldname) {
        case "photo":
            allowedFileTypes = ALLOWED_PHOTO_TYPES;
            break;
        case "video":
            allowedFileTypes = ALLOWED_VIDEO_TYPES;
            break;
        default:
            allowedFileTypes = [];
            break;
    }
    const extension = mime.extension(file.mimetype);
    if (allowedFileTypes.includes(extension)) {
        if (file.fieldname === "video" && file.size >= BYTES_PER_VIDEO) {
            return `File cannot exceed ${BYTES_PER_VIDEO / BYTES_PER_MEGABYTE}MB`;
        }
        if (file.fieldname === "photo" && file.size >= BYTES_PER_PHOTO) {
            return `File cannot exceed ${BYTES_PER_PHOTO / BYTES_PER_MEGABYTE}MB`;
        }
        return ""
    }
    else {
        return `Only ${stringArrayToSentence(allowedFileTypes)} files are permitted for ${file.fieldname}s`;
    }
}

function getThumbnailVideoUpload() {
    const storage = multer.diskStorage({
        destination: MULTIMEDIA_DIRECTORY,
        filename: generateFileName
    });

    const upload = multer({ storage: storage });

    return upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "video", maxCount: 1 }
    ]);
}

module.exports = { getThumbnailVideoUpload, getInvalidFileMessage, stringArrayToSentence, getSingleUpload };
