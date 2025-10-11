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


