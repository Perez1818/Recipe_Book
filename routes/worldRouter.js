const { Router } = require("express");
const worldController = require("../controllers/worldController.js");

const worldRouter = Router();

worldRouter.get("/", worldController.getWorldMap);

module.exports = worldRouter;
