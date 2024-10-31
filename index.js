const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { TodoApi } = require("./models/todoApi");
const sequelize = require("./models/db");

const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("./utils/authentication");
const User = require("./models/user");
const acess = require("./middleware/acess");
const { Sequelize } = require("sequelize");
const app = express();
const PORT = 8080;

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: "To many request !!!",
});

app.use(express.json());
app.use(morgan("tiny"));
app.use(limiter);

// create a new Todo tasks
app.post("/create", acess, async (request, response) => {
  console.log(request.body);

  try {
    const todo = await TodoApi.create({
      ...request.body,
      userId: request.userId,
    });
    response.status(200).json({
      message: "Task has been added",
      task: todo,
    });
  } catch (error) {
    response.status(400).json({ message: "Task not added", error: error });
  }
});

// get all tasks from database
app.get("/receive", acess, async (request, response) => {
  try {
    const todo = await TodoApi.findAll({
      where: {
        userId: request.userId,
        expiry_date: { [Sequelize.Op.gt]: new Date() },
      },
    });
    response.status(200).json({ message: "Taske are..", todo });
  } catch (error) {
    response.send("not found any tasks");
  }
});

// update tasks to database
app.put("/update", acess, async (request, response) => {
  try {
    const { id, ...updateData } = request.body;
    const task = await TodoApi.findOne({ where: { id, userId: req.userId } });

    if (!task) {
      return response.status(400).json({
        message: "Todo task id is required!!",
      });
    }

    await task.update(updateData);
    response.status(200).json({ message: "Task updated", task });
  } catch (error) {
    response.send("no task to updated", error);
  }
});

// delete tasks to database
app.delete("/delete", acess, async (request, response) => {
  const { id } = request.body;

  try {
    const task = await TodoApi.findOne({
      where: { id, userId: request.userId },
    });

    if (!task) return res;
  } catch (error) {
    response.status(400).json({ message: error });
  }
});

// register
app.post("/register", async (request, response) => {
  try {
    const { username, password } = request.body;
    const hashedPassword = await hashPassword(password);
    const user = await User.create({ username, password: hashedPassword });
    response.status(200).json({ message: "user register vako xa " });
  } catch (error) {
    response.status(400).json({ message: "User registration failed" });
  }
});

// login
app.post("/login", async (request, response) => {
  try {
    const { username, password } = request.body;
    const user = await User.findOne({ where: { username } });

    if (user && (await comparePassword(password, user.password))) {
      const token = generateToken(user);
      response.status(200).json({ message: "You are logged in!", token });
    } else {
      response.status(400).json({ message: "Wrong username or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    response.status(500).json({
      message: "Login failed due to a server error",
      error: error.message,
    });
  }
});

// universal route
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    await sequelize.authenticate();
    console.log("Database connect vako xa la sathi haruuuuuu.....");

    await sequelize.sync({ force: false });
    console.log("Sync successful....");
  } catch (error) {
    console.log("Database connection failed", error);
  }
});
