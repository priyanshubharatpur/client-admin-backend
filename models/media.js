const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  uniqueName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: false,
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
  },
  cloudinaryUrl: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Media", mediaSchema);
