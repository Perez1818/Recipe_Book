const PROJECT_TITLE = "Recipe Book";

exports.getIndex = (request, response) => {
    response.render("index", { browserTitle: PROJECT_TITLE, pageTitle: PROJECT_TITLE });
};
