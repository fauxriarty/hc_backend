const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../models');

const getUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

const getUser = async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ 
    where: { id: parseInt(id) }
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

const createUser = async (req, res) => {
  try {
    const { name, email, phoneNumber, isWhatsApp, newsletter, occupation, address, dateOfBirth, haves, wishes } = req.body;
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phoneNumber,
        isWhatsApp,
        newsletter,
        occupation,
        address,
        dateOfBirth,
        haves: {
          create: haves,
        },
        wishes: {
          create: wishes,
        },
      },
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
  if (user && password === user.dateOfBirth.split('-').reverse().join('')) {
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful!', token, userId: user.id });
  } else {
    res.status(401).json({ error: 'Invalid phone number or password' });
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  createUser,
  loginUser,
};
  