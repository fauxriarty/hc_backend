const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../models');

const getUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

const getUser = async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, address, phoneNumber, dateOfBirth } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address,
        phoneNumber,
        dateOfBirth,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful!', token });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  loginUser,
};
