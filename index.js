const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { TodoApi, Sequelize, sequelize } = require("./models/todoApi");

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
app.post("/create", async (request, response) => {
  try {
    const todo = await TodoApi.create(request.body);
    response.status(200).json({
      message: "Task has been added",
      task: todo,
    });
  } catch (error) {
    response.send("not updated");
  }
});

// get all tasks from database
app.get("/receive", async (request, response) => {
  try {
    const todo = await TodoApi.findAll();
    if (todo) {
      response.status(200).json({
        message: "All Tasks are listed below:",
        task: todo,
      });
    } else {
      response.status(400).json({
        message: "Todo task is not found!",
      });
    }
  } catch (error) {
    response.send("not found any tasks");
  }
});

// update tasks to database
app.put("/update", async (request, response) => {
  try {
    const { id, ...updateData } = request.body;

    if (!id) {
      return response.status(400).json({
        message: "Todo task id is required!!",
      });
    }

    const updated = await TodoApi.update(
      { ...updateData },
      {
        where: {
          id: id,
        },
      }
    );

    if (updated) {
      return response.status(200).json({
        message: "Todo tasks is updated!",
        task: await TodoApi.findOne({ where: { id } }),
      });
    } else {
      return response.status(400).json({
        message: "Todo task is not found!",
      });
    }
  } catch (error) {
    response.send("no task to updated", error);
  }
});

// delete tasks to database
app.delete("/delete", async (request, response) => {
  try {
    const { id } = request.body;

    if (!id) {
      return response
        .status(400)
        .json({ message: "Todo tasks is required for deleted" });
    }

    const deleted = await TodoApi.destroy({
      where: {
        id: id,
      },
    });

    if (deleted) {
      return response.status(200).json({
        message: "Successfully deleted",
      });
    } else {
      response.status(404).json({
        message: "Todo task is not found!",
      });
    }
  } catch (error) {
    response.status(400).json({ message: error });
  }
});

//universal route
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  sequelize
    .authenticate()
    .then(() => {
      console.log("Database connect vako xa la sathi haruuuuuu.....");
    })
    .catch((error) => {
      console.log("connect vako xaina ");
    });
});
