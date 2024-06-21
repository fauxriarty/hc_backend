const express = require('express');
const router = express.Router();
const { getGeminiUsersByCategoryAndState, fetchRelevantWishes } = require('../handlers/gemini_handlers');

router.post('/admin/geminiQueryByCategoryAndState', getGeminiUsersByCategoryAndState);
router.post('/wishes/relevant', async (req, res) => {
  const { userHaves, allWishes } = req.body;
  try {
    const relevantWishes = await fetchRelevantWishes(userHaves, allWishes);
    res.json(relevantWishes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
