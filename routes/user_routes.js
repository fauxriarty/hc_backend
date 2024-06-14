const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  loginUser,
  updateUser,
  getUsersByState,
  getUsersByCategoryAndState,
  updateUserHaves,
  updateUserWishes,
} = require('../handlers/user_handlers');

const router = express.Router();

router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.post('/users', createUser);
router.post('/login', loginUser);
router.put('/users/:id/haves', updateUserHaves); 
router.put('/users/:id/wishes', updateUserWishes);

module.exports = router;
