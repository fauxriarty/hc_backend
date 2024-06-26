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
      haves: {
        create: haves,
      },
      wishes: {
        create: wishes.map(wish => ({
          ...wish,
          skills: { set: wish.skills },
        })),
      },
    };

    const user = await prisma.user.create({
      data: dataToCreate,
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ user, token });
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
    const { category, description, skills } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        wishes: {
          create: [{ category, description, skills }],
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

const removeUserHave = async (req, res) => {
  try {
    const { id, haveId } = req.params;

    const userHave = await prisma.have.findUnique({
      where: { id: parseInt(haveId) },
    });

    if (!userHave) {
      return res.status(404).json({ error: "Have not found" });
    }

    await prisma.have.delete({
      where: { id: parseInt(haveId) },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { haves: true },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error removing user have:", error);
    res.status(500).json({ error: error.message });
  }
};

const removeUserWish = async (req, res) => {
  try {
    const { id, wishId } = req.params;

    const userWish = await prisma.wish.findUnique({
      where: { id: parseInt(wishId) },
    });

    if (!userWish) {
      return res.status(404).json({ error: "Wish not found" });
    }

    await prisma.wish.delete({
      where: { id: parseInt(wishId) },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { wishes: true },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error removing user wish:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateWishSkills = async (req, res) => {
  const { userId, wishId } = req.params;
  const { skill, action } = req.body;

  try {
    const wish = await prisma.wish.findUnique({
      where: { id: parseInt(wishId) },
    });

    if (!wish) {
      return res.status(404).json({ error: "Wish not found" });
    }

    let updatedSkills = wish.skills || [];
    if (action === "add") {
      updatedSkills = [...updatedSkills, skill];
    } else if (action === "remove") {
      updatedSkills = updatedSkills.filter((s) => s !== skill);
    }

    await prisma.wish.update({
      where: { id: parseInt(wishId) },
      data: {
        skills: updatedSkills,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { wishes: true },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(`Error updating wish skills:`, error);
    res.status(500).json({ error: error.message });
  }
};


const getUserWishes = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { wishes: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.wishes);
  } catch (error) {
    console.error("Error fetching user wishes:", error);
    res.status(500).json({ error: error.message });
  }
};

const getUserHaves = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { haves: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.haves);
  } catch (error) {
    console.error("Error fetching user haves:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  loginUser,
  updateUserHaves,
  updateUserWishes,
  removeUserHave,
  removeUserWish,
  getUserWishes,
  getUserHaves,
  updateWishSkills,  
};
