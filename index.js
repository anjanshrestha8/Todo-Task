const express = require("express");
const { Op } = require("sequelize");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const TodoApi = require("./models/todoApi");
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

// sse variable
const totalActiveUsers = [];

let Status;
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: "To many request !!!",
});

app.use(express.json());
app.use(morgan("tiny"));
app.use(limiter);

// sse ko code  ->

app.get("/notifications", (request, response) => {
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache");
  response.setHeader("Connection", "keep-alive");

  totalActiveUsers.push(response);

  request.on("close", () => {
    const indexOfDisconnectedUser = totalActiveUsers.indexOf(response);
    if (indexOfDisconnectedUser !== -1) {
      totalActiveUsers.splice(indexOfDisconnectedUser, 1); // -> remove 1 element from array which is disconnected whose index is stored on -> indexOfDisconnectedUser
    }
  });
});

cron.schedule("* * * * *", async () => {
  console.log("Expired xa kee xaina check gardai xu mah ");
  try {
    const expiredTasks = await TodoApi.findAll({
      where: {
        Expiry_Date: { [Op.lt]: new Date() },
        status: "pending",
      },
    });

    if (expiredTasks.length > 0) {
      await TodoApi.update(
        { status: "expired" },
        { where: { id: expiredTasks.map((task) => task.id) } }
      );
    }
    console.log("Expired Tasked are updated!!!");

    // notification ko code 🧑‍💻
    const notifications = {
      message: "Some Tasks have expired",
      tasks: expiredTasks,
    };

    totalActiveUsers.forEach((activeUsers) => {
      activeUsers.write(`Data: ${JSON.stringify(notifications)}\n\n `);
    });

    console.log("Notification nee pathako xu sse bata.");
  } catch (error) {
    console.error("Error updating tasks:", error);
  }
});

// create a new Todo tasks
app.post("/create", acess, async (request, response) => {
  console.log(request.body);
  console.log(TodoApi);
  const todo = request.body;
  await sequelize
    .sync()
    .then(() => {
      TodoApi.create({
        ...request.body,
      });
      response.status(200).json({
        message: "Task has been added",
        task: todo,
      });
    })
    .catch((error) => {
      response.status(400).json({ message: "Task not added", error: error });
      console.log(error);
    });
});

// get all tasks from database
app.get("/receive", acess, async (request, response) => {
  console.log(TodoApi);

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
    const user = await User.create({
      username: username,
      password: hashedPassword,
    });
    response.status(200).json({ message: "user register vako xa " });
  } catch (error) {
    response.status(400).json({ message: "User registration failed" });
  }
});

// login
app.post("/login", async (request, response) => {
  try {
    const { username, password } = request.body;
    const user = await User.findOne({
      where: { username },
    });

    if (user && (await comparePassword(password, user.password))) {
      const token = generateToken(user);
      response
        .status(200)
        .json({ message: "You are logged in!", token: token });
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
