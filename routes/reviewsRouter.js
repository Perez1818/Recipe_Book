const { Router } = require("express");
const pool = require("../database/pool.js");
const reviewsController = require("../controllers/reviewsController.js");

const reviewsRouter = Router();

reviewsRouter.get("/recipe/:recipeId", reviewsController.getReviewsByRecipe);   // Get reviews for specific recipe
reviewsRouter.get("/:id", reviewsController.getReview);   // Get one review by ID
reviewsRouter.get("/", reviewsController.listReviews);    // Get all reviews
reviewsRouter.post("/", reviewsController.createReview);  // Create a review
reviewsRouter.post("/:id/feedback", reviewsController.addReviewFeedback);  // Add like/dislike info to DB
reviewsRouter.put("/:id", reviewsController.updateReview);     // Update an existing review
reviewsRouter.delete("/:id", reviewsController.deleteReview);  // Delete an existing review

module.exports = reviewsRouter;
