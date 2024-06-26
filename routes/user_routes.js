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
  updateWishSkills,
  getUserWishes,
  getUserHaves,
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
router.put("/:id/wishes/:wishId/skills", updateWishSkills);
router.get("/:userId/wishes", getUserWishes);  
router.get("/:userId/haves", getUserHaves);    

module.exports = router;
