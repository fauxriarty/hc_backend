const jwt = require("jsonwebtoken");
const prisma = require("../models");

require("dotenv").config();



// fn to create a new user
const createUser = async (req, res) => {
  try {
    const {
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
      haves,
      wishes,
    } = req.body;

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

    console.log("User created successfully:", user);
    res.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message });
  }
};

// fn to login user
const loginUser = async (req, res) => {
  const { phoneNumber, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (
      user &&
      password ===
        user.dateOfBirth
          .toISOString()
          .split("T")[0]
          .split("-")
          .reverse()
          .join("")
    ) {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      console.log("Login successful for user:", user.id);
      res.json({ message: "Login successful!", token, userId: user.id });
    } else {
      console.log(
        "Invalid phone number or password for phone number:",
        phoneNumber
      );
      res.status(401).json({ error: "Invalid phone number or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

const getUser = async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        haves: true,
        wishes: true,
      },
    });

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
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
      include: { haves: true },
    });

    res.json(user);
  } catch (error) {
    console.error("Error updating user haves:", error);
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
      include: { wishes: true },
    });

    res.json(user);
  } catch (error) {
    console.error("Error updating user wishes:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUserWishes,
  updateUserHaves,
  createUser,
  loginUser,
};
