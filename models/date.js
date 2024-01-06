const mongoose = require("mongoose");

const dateSchema = new mongoose.Schema({
  date: {
    type: String,
  },
});

module.exports = mongoose.model("Dates", dateSchema);
