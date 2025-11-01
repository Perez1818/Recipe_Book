const {Router} = require("express");
const pool = require("../database/pool.js");
const reviewsController = require("../controllers/reviewsController.js");

const reviewsRouter = Router();

reviewsRouter.get("/recipe/:recipeId", reviewsController.getReviewsByRecipe);   // Get reviews for specific recipe
reviewsRouter.get("/:id", reviewsController.getReview);   // Get one review by ID
reviewsRouter.get("/", reviewsController.listReviews);    // Get all reviews
reviewsRouter.post("/", reviewsController.createReview);
reviewsRouter.put("/:id", reviewsController.updateReview);
reviewsRouter.delete("/:id", reviewsController.deleteReview);

module.exports = reviewsRouter;
