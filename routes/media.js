const express = require("express");
const multer = require("multer");
const router = express.Router();
const path = require("path");
const Media = require("../models/media");
const Dates = require("../models/date");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary").v2;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

cloudinary.config({
  cloud_name: "de4hxwxko",
  api_key: "276658948336775",
  api_secret: "fW2jODyryImPXLB7vsaPlWRSD_Y",
});

router.post("/upload", upload.single("mediaFile"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, error: "No file was uploaded." });
    }

    const fileBuffer = file.buffer.toString("base64");
    const fileType = file.mimetype.split("/")[0];

    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const filename = `${uniqueId}${fileExtension}`;

    const cloudinaryOptions = {
      public_id: filename,
      folder: "media",
      resource_type: fileType === "video" ? "video" : "auto",
    };
    let result;
    try {
      result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${fileBuffer}`,
        cloudinaryOptions
      );
    } catch (uploadError) {
      console.error("Error uploading to Cloudinary:", uploadError);
      return res
        .status(500)
        .json({ success: false, error: "Error uploading to Cloudinary." });
    }

    const newMedia = new Media({
      date: req.body.date,
      uniqueName: filename,
      cloudinaryPublicId: result.public_id,
      cloudinaryUrl: result.secure_url,
    });

    try {
      await newMedia.save();
    } catch (error) {
      console.log("Error saving media:", error);
    }
    const newDate = new Dates({ date: req.body.date });
    try {
      await newDate.save();
    } catch (error) {
      console.log("Error saving date:", error);
    }

    res.json({
      success: true,
      uploadedFile: { fileType, cloudinaryUrl: result.secure_url },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/:date", async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const formattedDate = date.toISOString().split("T")[0];
    const media = await Media.find({ date: formattedDate });
    res.json({ success: true, media });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

async function deleteFromCloudinary(publicId) {
  try {
    const fileExtension = publicId.split(".").pop().toLowerCase();
    const isVideo = ["mp4", "mov", "avi"].includes(fileExtension);
    if (isVideo) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    } else {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error(
      "Error deleting resource from Cloudinary: error message: ",
      error.message
    );
  }
}

router.delete("/delete/:uniqueName/:publicId/:date", async (req, res) => {
  const uniqueName = req.params.uniqueName;
  const publicId = req.params.publicId;
  const date = req.params.date;
  try {
    const deletedMedia = await Media.findOneAndDelete({ uniqueName });
    const deletedDate = await Dates.findOneAndDelete(date);

    if (!deletedDate) {
      return res
        .status(404)
        .json({ success: false, message: "Date not found" });
    }
    if (!deletedMedia) {
      return res
        .status(404)
        .json({ success: false, message: "Media not found" });
    }
    await deleteFromCloudinary(publicId);

    return res
      .status(200)
      .json({ success: true, message: "Media deleted successfully" });
  } catch (error) {
    console.error("Error deleting media:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/api/dates", async (req, res) => {
  try {
    const allDates = await Dates.find({}, { _id: 0, date: 1 });
    const dateArray = allDates.map((dateObj) => dateObj.date);
    res.json({ success: true, dates: dateArray });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
