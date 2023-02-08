require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const MONGO_URL = process.env.MONGO_URL;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect(MONGO_URL);

// =================================================================================
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  log: [
    {
      date: String,
      duration: Number,
      description: String,
    },
  ],
  count: Number,
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app
  .route("/api/users")
  .post((req, res) => {
    const username = req.body.username;
    const user = new User({ username });
    user.save((err, data) => {
      if (err) {
        res.json({ error: err });
      }
      res.json(data);
    });
  })
  .get((req, res) => {
    User.find((err, documents) => {
      if (err) return console.error(err);

      res.json(documents);
    });
  });

app.post("/api/users/:_id/exercises", (req, res) => {
  const { description } = req.body;
  const duration = parseInt(req.body.duration);
  let date;
  const id = req.params._id;

  if (req.body.date) {
    date = new Date(req.body.date).toDateString();
  } else {
    date = new Date().toDateString();
  }

  const exercise = {
    date,
    duration,
    description,
  };

  User.findByIdAndUpdate(
    id,
    {
      $push: { log: exercise },
      $inc: { count: 1 },
    },
    { new: true },
    (err, user) => {
      if (user) {
        const updatedExercise = {
          _id: id,
          username: user.username,
          ...exercise,
        };
        res.json(updatedExercise);
      }
    }
  );
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { from, to, limit } = req.query;
  console.log(from, to, limit);

  User.findById(req.params._id, (err, user) => {
    if (user) {
      if (from || to || limit) {
        const logs = user.log;
        const filteredLogs = logs.filter((log) => {
          const formattedLogDate = new Date(log.date)
            .toISOString()
            .split("T")[0];
          return true;
        });

        const slicedLogs = limit ? filteredLogs.slice(0, limit) : filteredLogs;
        user.log = slicedLogs;
      }

      res.json(user);
    }
  });
});

// ================================================

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
