const { Router } = require("express");
const usersController = require("../controllers/usersController.js");
const filesController = require("../controllers/filesController.js");

const router = Router();

router.get("/", usersController.getIndex);
router.get("/signup", usersController.getSignUp);
router.post("/signup", usersController.signUpUser);
router.get("/login", usersController.getLogin);
router.post("/login", usersController.loginUser);
router.get("/logout", usersController.logoutUser);

router.get("/user/:username", usersController.getUserProfile);
router.get("/settings", usersController.getUserSettings);
router.post("/settings/profile", usersController.updateProfile);

router.get("/upload/avatar", filesController.getAvatarUpload);
router.post("/upload/avatar", filesController.uploadAvatar);

router.get("/upload/multimedia", filesController.getMultimediaUpload);
router.post("/upload/multimedia", filesController.uploadMultimedia);

module.exports = router;
