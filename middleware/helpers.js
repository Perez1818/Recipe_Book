const filesystem = require("fs");

exports.getErrorMessages = (result) => {
    const errors = result.array({ onlyFirstError: true });

    const errorMessages = {};

    for (let error of errors) {
        let fieldName = error.path;
        let errorMessage = error.msg;
        errorMessages[fieldName] = errorMessage;
    }

    return errorMessages;
}

exports.attributeCount = (object) => {
    return Object.keys(object).length;
}

exports.deleteFile = (filePath) => {
    filesystem.unlink(filePath, (error) => {
        if (error) {
            console.error(`Could not delete file: ${error}`);
        }
    });
}

exports.deleteFiles = (fileArray) => {
    for (let file of fileArray) {
        exports.deleteFile(file.path);
    }
}
