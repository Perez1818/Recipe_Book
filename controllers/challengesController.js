const { getSingleUpload } = require("../middleware/fileUploader.js");

const PARENT_DIRECTORY = __dirname;

const UPLOADS_DIRECTORY = `${PARENT_DIRECTORY}/../public/uploads`;
const CHALLENGE_DIRECTORY = `${UPLOADS_DIRECTORY}/challenge`;
const CHALLENGE_THUMBNAIL_FIELD_NAME = "thumbnail";

const uploadSingleThumbnail = getSingleUpload(CHALLENGE_DIRECTORY, CHALLENGE_THUMBNAIL_FIELD_NAME);

exports.getChallengeMaker = async (request, response) => {
    response.render("challenge-maker");
};

exports.createChallenge = async (request, response) => {
    uploadSingleThumbnail(request, response, async (error) => {
        console.log(request.file);
        console.log(request.body);
        response.status(501).send("Creating a challenge is not implemented yet.");
    });
};
