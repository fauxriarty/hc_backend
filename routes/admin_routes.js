const express = require('express');
const router = express.Router();
const { getUsersByCategoryAndState } = require('../handlers/admin_handlers');

router.post('/admin/queryByCategoryAndState', getUsersByCategoryAndState);

module.exports = router;
