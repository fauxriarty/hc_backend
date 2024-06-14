const express = require('express');
const router = express.Router();
const { getGeminiUsersByCategoryAndState } = require('../handlers/gemini_handlers');

router.post('/admin/geminiQueryByCategoryAndState', getGeminiUsersByCategoryAndState);

module.exports = router;
