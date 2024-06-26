const express = require("express");
const {
  getAllWishes,
  getRelevantWishes,
  requestToJoinWish,
  getRequestsForUserWishes,
  respondToRequest,
  sendInvite,
  handleInviteResponse,
} = require("../handlers/wish_handlers");

const router = express.Router();

router.get("/", getAllWishes);
router.post("/relevant", getRelevantWishes);
router.post("/request/:wishId", requestToJoinWish);
router.get("/requests", getRequestsForUserWishes);
router.post("/requests/:requestId/respond", respondToRequest);
router.post("/:wishId/invite", sendInvite);
router.post("/invites/:inviteId/respond", handleInviteResponse);

module.exports = router;