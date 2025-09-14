const { Router } = require("express");
const controller = require("../controllers/controller.js");

const router = Router();

router.get("/", controller.getIndex);
router.get("/users", controller.getUsers);
router.get("/recipes", controller.getRecipeMaker);

router.get("/signup", controller.getSignUp);
router.post("/signup", controller.signUpUser);

router.get("/login", controller.getLogin);
router.post("/login", controller.loginUser);

router.get("/logout", controller.logoutUser);

router.get("/api/recipes", controller.getRecipes);
router.post("/api/recipes", controller.createRecipe);

module.exports = router;
