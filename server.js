const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user_routes');
const taskRoutes = require('./routes/task_routes');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();


const app = express();

app.use(cors());
app.use(express.json());

app.use('/', userRoutes);
app.use('/', taskRoutes);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
