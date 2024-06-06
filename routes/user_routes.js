const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  loginUser,
  updateUser
} = require('../handlers/user_handlers');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.get('/users', authenticateToken, getUsers);
router.get('/users/:id', authenticateToken, getUser); // protected routes

router.post('/users', createUser);
router.post('/login', loginUser);
router.put('/users/:id', authenticateToken, updateUser);

module.exports = router;
