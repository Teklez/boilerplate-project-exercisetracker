const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
});

const userModel = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  const username = req.body.username;

  try {
    const userExists = await userModel.findOne({ username: username });
    if (userExists) {
      throw { message: "User already exists!" };
    } else {
      const newUser = new userModel({ username: username });
      await newUser.save();
      res.json({
        username: newUser.username,
        _id: newUser._id,
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { duration, description, date } = req.body;
  const id = req.params._id;
  const dateObj = date ? new Date(date) : new Date();

  try {
    const user = await userModel.findById(id);
    if (user) {
      user.log.push({
        description: description,
        duration: parseInt(duration),
        date: dateObj.toDateString(),
      });
      await user.save();

      res.json({
        username: user.username,
        description: description,
        duration: parseInt(duration),
        date: dateObj.toDateString(),
        _id: user._id,
      });
    } else {
      console.log("user not found", id);
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/users", async (req, res) => {
  const users = await userModel.find().select("username _id").exec();
  res.send(users);
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const _id = req.params._id;
  const obId = new mongoose.Types.ObjectId(_id);

  const { from, to, limit } = req.query;

  try {
    const user = await userModel.findById(obId);
    if (!user) {
      throw { message: "User not found" };
    }

    let logs = user.log;

    if (from) {
      const fromDate = new Date(from);
      logs = logs.filter((log) => new Date(log.date) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      logs = logs.filter((log) => new Date(log.date) <= toDate);
    }

    if (limit) {
      logs = logs.slice(0, parseInt(limit));
    }

    const logsWithoutId = logs.map((log) => ({
      description: log.description.toString(),
      duration: parseInt(log.duration),
      date: log.date.toString(),
    }));

    res.json({
      username: user.username,
      count: parseInt(logs.length),
      _id: user._id,
      log: logsWithoutId,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "An error occurred" });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
