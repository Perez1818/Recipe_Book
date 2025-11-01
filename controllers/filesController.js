const { getMultiUpload, getInvalidFileMessage } = require("../middleware/fileUploader.js");

exports.getMultimediaUpload = async (request, response) => {
    if (request.isAuthenticated()) {
        response.render("multimedia");
    }
    else {
        response.render("login");
    }
}

exports.uploadMultimedia = [
    getMultiUpload(),
    async (request, response) => {
        console.log(request.files);
        const photoFile = "photo" in request.files ? request.files["photo"][0] : null;
        const videoFile = "video" in request.files ? request.files["video"][0] : null;

        let photoName = "";
        let videoName = "";

        let photoErrorMessage = "";
        let videoErrorMessage ="";

        if (photoFile) {
            photoErrorMessage = getInvalidFileMessage(photoFile);
            if (!photoErrorMessage) {
                photoName = photoFile.filename;
            }
        }

        if (videoFile) {
            videoErrorMessage = getInvalidFileMessage(videoFile);
            if (!videoErrorMessage) {
                videoName = videoFile.filename
            }
        }
        
        console.log(request.files);

        response.render("multimedia", { photoErrorMessage: photoErrorMessage, videoErrorMessage: videoErrorMessage, photoName: photoName, videoName: videoName });
    }
]
