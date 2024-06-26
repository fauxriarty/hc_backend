const express = require("express");
const { getAllHaves, getRelevantHaves } = require("../handlers/have_handlers");

const router = express.Router();

router.get("/", getAllHaves);
router.post("/relevant", getRelevantHaves);

module.exports = router;