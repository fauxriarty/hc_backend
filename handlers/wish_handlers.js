const prisma = require("../models");
const { fetchRelevantWishes } = require("./gemini_handlers");

const getAllWishes = async (req, res) => {
  try {
    const wishes = await prisma.wish.findMany({
      include: {
        user: true,
        participants: {
          include: {
            user: true
          }
        },
        requests: {
          include: {
            user: true
          }
        }
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
        participants: {
          include: {
            user: true
          }
        },
        requests: {
          include: {
            user: true
          }
        }
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

const requestToJoinWish = async (req, res) => {
  const { wishId } = req.params;
  const { userId } = req.body;
  try {
    const newRequest = await prisma.request.create({
      data: {
        wishId: parseInt(wishId),
        userId: parseInt(userId),
        status: 'pending'
      }
    });
    res.json(newRequest);
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ error: error.message });
  }
};

const getRequestsForUserWishes = async (req, res) => {
  const { userId } = req.query;
  try {
    const wishes = await prisma.wish.findMany({
      where: { userId: parseInt(userId) },
      include: { 
        requests: { 
          include: { user: true } 
        },
        participants: {
          include: { user: true }
        }
      }
    });
    res.json(wishes);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: error.message });
  }
};

const respondToRequest = async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;
  try {
    const updatedRequest = await prisma.request.update({
      where: { id: parseInt(requestId) },
      data: { status }
    });

    if (status === 'accepted') {
      const request = await prisma.request.findUnique({ where: { id: parseInt(requestId) } });
      await prisma.wishParticipant.create({
        data: {
          wishId: request.wishId,
          userId: request.userId,
        }
      });
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllWishes,
  getRelevantWishes,
  requestToJoinWish,
  getRequestsForUserWishes,
  respondToRequest,
};
