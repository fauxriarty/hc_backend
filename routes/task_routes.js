const express = require('express');
const {
  getTasks,
  createTask,
} = require('../handlers/task_handlers');

const router = express.Router();

router.get('/tasks', getTasks);
router.post('/tasks', createTask);

module.exports = router;
