const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getTasks = async (req, res) => {
  const tasks = await prisma.task.findMany();
  res.json(tasks);
};

const createTask = async (req, res) => {
  const { description, completed, userId } = req.body;
  const task = await prisma.task.create({
    data: {
      description,
      completed,
      user: { connect: { id: userId } },
    },
  });
  res.json(task);
};

module.exports = {
  getTasks,
  createTask,
};
