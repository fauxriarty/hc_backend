const express = require("express");
const {
  getAllWishes,
  getRelevantWishes,
  requestToJoinWish,
  getRequestsForUserWishes,
  respondToRequest,
} = require("../handlers/wish_handlers");

const router = express.Router();

router.get("/", getAllWishes); 
router.post("/relevant", getRelevantWishes);
router.post("/request/:wishId", requestToJoinWish);
router.get("/requests", getRequestsForUserWishes);
router.post("/requests/:requestId/respond", respondToRequest);

module.exports = router;
