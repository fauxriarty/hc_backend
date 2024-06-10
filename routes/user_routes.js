const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  loginUser,
  updateUser,
  getUsersByState,
  getUsersByCategoryAndState,
} = require('../handlers/user_handlers');

const router = express.Router();

router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.post('/users', createUser);
router.post('/login', loginUser);
router.put('/users/:id', updateUser);
router.post('/admin/queryByState', getUsersByState);
router.post('/admin/queryByCategoryAndState', getUsersByCategoryAndState);

module.exports = router;
