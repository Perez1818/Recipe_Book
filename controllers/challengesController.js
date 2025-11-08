const { getSingleUpload } = require("../middleware/fileUploader.js");
const challengesTable = require("../database/challengesTable.js");

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
        try {
            await challengesTable.createChallenge(request.user.id, request.body.title, request.body.description, request.file.filename, 
                                                  request.body.start, request.body.cutoff, request.body.points, 
                                                  request.body["required-ingredients"], request.body["max-ingredients"]);
            response.status(201).send("Challenge creation succeeded.");
        }

        catch (error) {
            response.status(400).send("Challenge creation failed.");
        }

        console.log(request.file);
        console.log(request.body);
    });
};
