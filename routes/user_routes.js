const express = require("express");
const {
  getUsers,
  getUser,
  createUser,
  loginUser,
  updateUserHaves,
  updateUserWishes,
  removeUserHave,
  removeUserWish,
} = require("../handlers/user_handlers");

const router = express.Router();

router.post("/", createUser);
router.post("/login", loginUser);
router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id/haves", updateUserHaves);
router.put("/:id/wishes", updateUserWishes);
router.delete("/:id/haves/:haveId", removeUserHave);
router.delete("/:id/wishes/:wishId", removeUserWish);

module.exports = router;
