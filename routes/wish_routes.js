const express = require("express");
const { getAllWishes, getRelevantWishes } = require("../handlers/wish_handlers");

const router = express.Router();

router.get("/", getAllWishes);
router.post("/relevant", getRelevantWishes);

module.exports = router;
