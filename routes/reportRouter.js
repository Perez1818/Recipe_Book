const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController.js");

router.post("/step-comment", reportController.reportStepComment);

module.exports = router;