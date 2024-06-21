const prisma = require("../models");
const { fetchRelevantWishes } = require("./gemini_handlers");

const getAllWishes = async (req, res) => {
  try {
    const wishes = await prisma.wish.findMany({
      include: {
        user: true,
      },
    });
    res.json(wishes);
  } catch (error) {
    console.error("Error fetching wishes:", error);
    res.status(500).json({ error: error.message });
  }
};

const getRelevantWishes = async (req, res) => {
  const { userId, userHaves } = req.body;
  try {
    const allWishes = await prisma.wish.findMany({
      include: {
        user: true,
      },
    });

    const relevantWishes = await fetchRelevantWishes(userHaves, allWishes);
    if (relevantWishes.length === 0) {
      console.log("No relevant wishes found. Showing all wishes.");
      res.json(allWishes);
    } else {
      console.log("Relevant wishes found. Showing relevant wishes.");
      res.json(relevantWishes);
    }
  } catch (error) {
    console.error("Error fetching relevant wishes:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllWishes,
  getRelevantWishes,
};
