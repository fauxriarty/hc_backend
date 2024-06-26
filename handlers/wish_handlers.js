const prisma = require("../models");
const { fetchRelevantWishes } = require("./gemini_handlers");

const getAllWishes = async (req, res) => {
  try {
    const wishes = await prisma.wish.findMany({
      include: {
        user: true,
        participants: {
          include: {
            user: {
              include: {
                haves: true,
              },
            },
          },
        },
        requests: {
          include: {
            user: true,
          },
        },
        invites: {
          include: {
            user: true,
          },
        },
      },
    });
    res.json(wishes);
  } catch (error) {
    console.error("Error fetching wishes:", error);
    res.status(500).json({ error: error.message });
  }
};

const getRelevantWishes = async (req, res) => {
  const { userHaves } = req.body;
  try {
    const allWishes = await prisma.wish.findMany({
      include: {
        user: true,
        participants: {
          include: {
            user: true,
          },
        },
        requests: {
          include: {
            user: true,
          },
        },
      },
    });

    const relevantWishes = await fetchRelevantWishes(userHaves, allWishes);
    res.json(relevantWishes.length > 0 ? relevantWishes : allWishes);
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
        status: 'pending',
      },
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
          include: { user: true },
        },
        participants: {
          include: { user: true },
        },
        invites: {
          include: { user: true },
        },
      },
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
      data: { status },
    });

    if (status === 'accepted') {
      const request = await prisma.request.findUnique({
        where: { id: parseInt(requestId) },
      });
      await prisma.wishParticipant.create({
        data: {
          wishId: request.wishId,
          userId: request.userId,
        },
      });
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ error: error.message });
  }
};

const sendInvite = async (req, res) => {
  const { wishId } = req.params;
  const { userId, senderId } = req.body;
  try {
    const invite = await prisma.invite.create({
      data: {
        wishId: parseInt(wishId),
        userId: parseInt(userId),
        status: 'pending',
        senderId: parseInt(senderId),
      },
    });
    res.json(invite);
  } catch (error) {
    console.error("Error sending invite:", error);
    res.status(500).json({ error: error.message });
  }
};

const handleInviteResponse = async (req, res) => {
  const { inviteId } = req.params;
  const { status } = req.body;
  try {
    const updatedInvite = await prisma.invite.update({
      where: { id: parseInt(inviteId) },
      data: { status },
    });

    if (status === 'accepted') {
      const invite = await prisma.invite.findUnique({
        where: { id: parseInt(inviteId) },
      });
      await prisma.wishParticipant.create({
        data: {
          wishId: invite.wishId,
          userId: invite.userId,
        },
      });
    }

    res.json(updatedInvite);
  } catch (error) {
    console.error("Error updating invite:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllWishes,
  getRelevantWishes,
  requestToJoinWish,
  sendInvite,
  getRequestsForUserWishes,
  handleInviteResponse,
  respondToRequest,
};
