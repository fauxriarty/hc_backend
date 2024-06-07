const express = require('express');
const router = express.Router();
const { handleAdminQuery } = require('../handlers/admin_handlers');

router.post('/admin/query', handleAdminQuery);

module.exports = router;
