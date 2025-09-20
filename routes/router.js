const { Router } = require("express");
const usersController = require("../controllers/usersController.js");
const recipesController = require("../controllers/recipesController.js");
const filesController = require("../controllers/filesController.js");

const router = Router();

router.get("/", usersController.getIndex);
router.get("/users", usersController.getUsers);
router.get("/recipes", recipesController.getRecipeMaker);

router.get("/signup", usersController.getSignUp);
router.post("/signup", usersController.signUpUser);

router.get("/login", usersController.getLogin);
router.post("/login", usersController.loginUser);

router.get("/logout", usersController.logoutUser);

router.get("/api/recipes", recipesController.getRecipes);
router.post("/api/recipes", recipesController.createRecipe);

router.get("/upload/avatar", filesController.getAvatarUpload);
router.post("/upload/avatar", filesController.uploadAvatar);

module.exports = router;
