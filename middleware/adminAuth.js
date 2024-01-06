// middleware/adminAuth.js
const Admin = require("../models/admin");

const adminAuth = async (req, res, next) => {
  const username = req.headers["admin-username"];
  const password = req.headers["admin-password"];

  try {
    const admin = await Admin.findOne({ username, password });

    if (!admin) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    // Attach the admin object to the request for later use
    req.admin = admin;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

module.exports = adminAuth;
