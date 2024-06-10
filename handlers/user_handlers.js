const jwt = require('jsonwebtoken');
const prisma = require('../models');

const getUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

const getUser = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Missing user id' });
  }
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    include: {
      haves: true,
      wishes: true,
    }
  });
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { skills } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { skills },
    });
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
};

const getUsersByCategoryAndLocation = async (req, res) => {
  const { category, adminLocation } = req.body;
  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            state: adminLocation,
          },
          {
            wishes: {
              some: {
                category,
              },
            },
          },
        ],
      },
      include: {
        wishes: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
};


const createUser = async (req, res) => {
  try {
    const { name, email, phoneNumber, isWhatsApp, newsletter, occupation, dateOfBirth, pincode, state, city, haves, wishes } = req.body;

    const dataToCreate = {
      name,
      email,
      phoneNumber,
      isWhatsApp,
      newsletter,
      occupation,
      dateOfBirth,
      pincode,
      state,
      city,
    };

    if (haves.length > 0 && haves[0].category && haves[0].description) {
      dataToCreate.haves = {
        create: haves,
      };
    }

    if (wishes.length > 0 && wishes[0].category && wishes[0].description) {
      dataToCreate.wishes = {
        create: wishes,
      };
    }

    const user = await prisma.user.create({
      data: dataToCreate,
    });

    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
};


const loginUser = async (req, res) => {
  const { phoneNumber, password } = req.body;
  const user = await prisma.user.findUnique({ where: { phoneNumber } });
  if (user && password === user.dateOfBirth.toISOString().split('T')[0].split('-').reverse().join('')) {
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful!', token, userId: user.id });
  } else {
    res.status(401).json({ error: 'Invalid phone number or password' });
  }
};


const getUsersByState = async (req, res) => {
  const { state } = req.body;
  try {
    const users = await prisma.user.findMany({
      where: {
        state: state,
      },
      include: {
        haves: true,
        wishes: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
};

const getUsersByCategoryAndState = async (req, res) => {
  const { category, state } = req.body;
  try {
    const users = await prisma.user.findMany({
      where: {
        state,
        haves: {
          some: {
            category,
          }
        }
      },
      include: {
        haves: true,
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
};
const updateUserHaves = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        haves: {
          create: [{ category, description }],
        },
      },
      include: { haves: true }, // Include haves in the response
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user haves:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateUserWishes = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        wishes: {
          create: [{ category, description }],
        },
      },
      include: { wishes: true }, // Include wishes in the response
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user wishes:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  updateUserWishes,
  updateUserHaves,
  createUser,
  getUsersByCategoryAndLocation,
  loginUser,
  getUsersByState,
  getUsersByCategoryAndState,
};
