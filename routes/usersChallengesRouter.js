const { Router } = require("express");
const usersChallengesController = require("../controllers/usersChallengesController.js");

const router = Router();

// Routes
// Create / participate in a challenge
router.post("/:userId/:challengeId", usersChallengesController.participateInChallenge);
// Update user–challenge details (like or status)
router.patch("/:userId/:challengeId/:recipeId", usersChallengesController.updateUserChallengeDetails);
// Get likes for a challenge
router.get("/:challengeId/likes", usersChallengesController.getChallengeLikes);
// Get number of participants for a challenge
router.get("/:challengeId/participants", usersChallengesController.getChallengeParticipantCount);
// Get number of winners for a challenge
router.get("/:challengeId/winners", usersChallengesController.getChallengeWinnerCount);
// Get specific user–challenge relationship
router.get("/:userId/:challengeId", usersChallengesController.getUserChallengeDetails);
// Delete user-challenge relation
router.delete("/:userId/:challengeId", usersChallengesController.deleteUserChallenge)

module.exports = router;
