// routes/auth.js
const express = require("express");
const router = express.Router();
const Admin = require("../models/admin");

// Route to authenticate admin credentials
router.post("/authenticate", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username and password are provided
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Username and password are required" });
    }

    // Check if the credentials match the admin's credentials
    const admin = await Admin.findOne({ username, password });

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // Admin credentials are valid
    res.json({ success: true, message: "Authentication successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
