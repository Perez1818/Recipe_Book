const { Router } = require("express");
const usersController = require("../controllers/usersController.js");
// const filesController = require("../controllers/filesController.js");

const router = Router();

router.get("/", usersController.getIndex);
router.get("/signup", usersController.getSignUp);
router.post("/signup", usersController.signUpUser);
router.get("/verify", usersController.verifyUser);
router.get("/login", usersController.getLogin);
router.post("/login", usersController.loginUser);
router.get("/logout", usersController.logoutUser);

router.get("/user/:username", usersController.getUserProfile);
router.get("/settings", usersController.getUserSettings);
router.post("/settings", usersController.updateProfile);

router.get("/settings/account", usersController.getAccountSettings);
router.post("/settings/account", usersController.updateAccount);

// router.get("/upload/multimedia", filesController.getMultimediaUpload);
// router.post("/upload/multimedia", filesController.uploadMultimedia);

router.get("/userDetails/me", usersController.getCurrentUser)
router.get("/userDetails/:id", usersController.getUserDetailsById);

router.get("/api/users", usersController.listUsers);

router.post("/users/:id/follow", usersController.followUser); // from follow-user branch
router.delete("/users/:id/follow", usersController.unfollowUser); // from follow-user branch
router.get("/users/:id/followers", usersController.getFollowers); // from follow-user branch
router.get("/users/:id/following", usersController.getFollowing); // from follow-user branch
router.get("/users/:id/isFollowing", usersController.isFollowing); // from follow-user branch

module.exports = router;
