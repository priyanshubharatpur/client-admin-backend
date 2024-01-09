const express = require("express");
const mongoose = require("mongoose");
const mediaRouter = require("./routes/media");
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const Admin = require("./models/admin");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Atlas connection string
const mongoDBAtlasURI = "mongodb+srv://piyushclientapp:U0wOilM33jOOeZkS@cluster0.m0bvivm.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(mongoDBAtlasURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

// Uncomment the line below to create the admin user
// createAdmin();

// Enable CORS middleware with origin option
app.use(cors());

const corsOptions = {
  origin: "http://localhost:3000", // Replace with the actual origin of your React app
  methods: 'OPTIONS, POST, GET, PUT, DELETE',
  allowedHeaders: 'Content-Type, Authorization',
};

// Enable OPTIONS preflight request
app.options('*', cors(corsOptions));

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/media", mediaRouter);
app.use("/auth", authRouter);
app.use("/users", userRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
