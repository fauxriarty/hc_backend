const prisma = require("../models");
const { fetchRelevantHaves } = require("./gemini_handlers");

const getAllHaves = async (req, res) => {
  try {
    const haves = await prisma.have.findMany({
      include: {
        user: true,
      },
    });
    res.json(haves);
  } catch (error) {
    console.error("Error fetching haves:", error);
    res.status(500).json({ error: error.message });
  }
};

const getRelevantHaves = async (req, res) => {
  const { userWishes } = req.body;
  try {
    const allHaves = await prisma.have.findMany({
      include: {
        user: true,
      },
    });

    const relevantHaves = await fetchRelevantHaves(userWishes, allHaves);
    res.json(relevantHaves.length > 0 ? relevantHaves : allHaves);
  } catch (error) {
    console.error("Error fetching relevant haves:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllHaves,
  getRelevantHaves,
};
