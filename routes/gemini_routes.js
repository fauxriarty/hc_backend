const express = require('express');
const router = express.Router();
const { getGeminiUsersByCategoryAndState, fetchRelevantWishes, fetchRelevantHaves } = require('../handlers/gemini_handlers');

router.post('/queryByCategoryAndState', getGeminiUsersByCategoryAndState);
router.post('/wishes/relevant', async (req, res) => {
  const { userHaves, allWishes } = req.body;
  try {
    const relevantWishes = await fetchRelevantWishes(userHaves, allWishes);
    res.json(relevantWishes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/haves/relevant', async (req, res) => {
  const { userWishes, allHaves } = req.body;
  try {
    const relevantHaves = await fetchRelevantHaves(userWishes, allHaves);
    res.json(relevantHaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
