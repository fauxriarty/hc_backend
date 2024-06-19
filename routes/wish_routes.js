const express = require("express");
const { getAllWishes } = require("../handlers/wish_handlers");

const router = express.Router();

router.get("/", getAllWishes);

module.exports = router;
