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
    if (userExits) {
      throw { message: "User already exists!" };
    } else {
      const newUser = new userModel({ username: username });
      newUser.save();
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
  const id = req.body[":_id"];
  const objectId = new mongoose.Types.ObjectId(id);
  console.log(objectId);
  try {
    const user = await userModel.findById(objectId);
    const dateObj = new Date(date);
    if (user) {
      user.log.push({
        description: description,
        duration: duration,
        date: dateObj,
      });
      user.save();
      

      res.json({
        username: user.username,
        _id: user._id,
        description: description,
        duration: duration,
        date: dateObj.toDateString(),
      });
    } else {
      console.log("user not found");
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const _id = req.params._id;
  const obId = new mongoose.Types.ObjectId(_id);
  try {
    const user = await userModel.findById(obId);
    if (!user) {
      throw { message: "User not found" };
    } else {
      let logsWithoutId = [];
      for (log of user.log) {
        logsWithoutId.push({
          description: log.description,
          duration: log.duration,
          date: log.date,
        });
      }

      res.json({
        username: user.username,
        count: user.log.length,
        _id: user._id,
        logs: logsWithoutId,
      });
    }
  } catch (err) {
    console.log(err);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
