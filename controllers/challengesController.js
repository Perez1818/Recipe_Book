const { getSingleUpload } = require("../middleware/fileUploader.js");
const challengesTable = require("../database/challengesTable.js");
const { validate, validationResult } = require("../middleware/formValidation.js");
const { getErrorMessages, attributeCount } = require("../middleware/helpers.js");

const PARENT_DIRECTORY = __dirname;

const UPLOADS_DIRECTORY = `${PARENT_DIRECTORY}/../public/uploads`;
const CHALLENGE_DIRECTORY = `${UPLOADS_DIRECTORY}/challenge`;
const CHALLENGE_THUMBNAIL_FIELD_NAME = "thumbnail";

const uploadSingleThumbnail = getSingleUpload(CHALLENGE_DIRECTORY, CHALLENGE_THUMBNAIL_FIELD_NAME);

exports.getChallengeMaker = async (request, response, next) => {
    const user = request.user;
    if (user) {
        response.render("challenge-maker");
    }
    else {
        response.redirect("/login");
    }
};

exports.createChallenge = async (request, response) => {
    uploadSingleThumbnail(request, response, async (error) => {
        try {
            await validate.challengeRequiredIngredients(request);   /* TODO: validate ingredients and remove duplicates when adding to database */

            await validate.challengeTitle(request);
            await validate.challengeDescription(request);
            await validate.avatarUpload(request);   // reused to validate challenge thumbnail
            await validate.challengeStart(request);
            await validate.challengeCutoff(request);
            await validate.challengePoints(request);
            await validate.challengeMaxIngredients(request);

            const user = request.user;
            if (user) {
                const result = validationResult(request);
                const errorMessages = getErrorMessages(result);
                
                if (attributeCount(errorMessages)) {
                    response.status(400).send({
                        message: "Challenge creation failed",
                        errorMessages: errorMessages
                    });
                }

                else {
                    const thumbnailName = (request.file === undefined) ? "" : request.file.filename;
                    await challengesTable.createChallenge(user.id, request.body.title, request.body.description, thumbnailName, 
                                                          request.body.start, request.body.cutoff, request.body.points, 
                                                          request.body["required-ingredients"], request.body["max-ingredients"]);

                    response.status(201).send({ message: "Challenge creation succeeded" });
                }
            }
            else {
                response.status(400).send({ message: "You must be logged in to do that." });
            }
        }

        catch (error) {
            response.status(400).send({ message: "Challenge creation failed" });
        }
    });
};
