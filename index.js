const express = require("express");
const mongoose = require("mongoose");
const mediaRouter = require("./routes/media");
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const Admin = require("./models/admin");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// mongoose.connect("mongodb://localhost/imageVideoDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

mongoose.connect(
  "mongodb+srv://piyushclientapp:U0wOilM33jOOeZkS@cluster0.m0bvivm.mongodb.net/?retryWrites=true&w=majority"
);

const createAdmin = () => {
  const admin = new Admin({
    username: "admin",
    password: "piyush@12345",
  });

  admin
    .save()
    .then(() => {
      console.log("Admin user created successfully");
    })
    .catch((error) => {
      console.error("Error creating admin user:", error);
    })
    .finally(() => {
      mongoose.connection.close();
    });
};

// createAdmin();

app.use(cors());

app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "OPTIONS, POST, GET, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.send();
});

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/media", mediaRouter);
app.use("/auth", authRouter);
app.use("/users", userRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
