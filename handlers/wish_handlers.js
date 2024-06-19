const prisma = require("../models");

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

module.exports = {
  getAllWishes,
};
