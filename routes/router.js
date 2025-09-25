const { Router } = require("express");
const usersController = require("../controllers/usersController.js");

const router = Router();

router.get("/signup", usersController.getSignUp);
router.post("/signup", usersController.signUpUser);
router.get("/login", usersController.getLogin);
router.post("/login", usersController.loginUser);
router.get("/logout", usersController.logoutUser);

module.exports = router;
