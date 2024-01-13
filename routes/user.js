const express = require("express");
const router = express.Router();
const User = require("../models/user");
const axios = require("axios");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const cloudinary = require("cloudinary").v2;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const downloadFile = async (cloudinaryUrl, localFilePath) => {
  try {
    const response = await axios.get(cloudinaryUrl, {
      responseType: "arraybuffer",
    });
    fs.writeFileSync(localFilePath, Buffer.from(response.data));
  } catch (error) {
    console.error("Error downloading file:", error.message);
  }
};

const addFrameToImage = async (
  originalImagePath,
  frameImagePath,
  outputImagePath,
  filename,
  phone,
  res
) => {
  try {
    //downloading img
    const localPath = `uploads/${filename}`;
    const localPathDir = path.dirname(localPath);
    await fs.promises.mkdir(localPathDir, { recursive: true });
    const localFilePath = path.resolve(__dirname, "..", localPath);
    await downloadFile(originalImagePath, localFilePath);
    //downloading frame
    const localFramePath = `uploads/${phone}/${filename}`;
    const localFramePathDir = path.dirname(localFramePath);
    await fs.promises.mkdir(localFramePathDir, { recursive: true });
    const localFrameFilePath = path.resolve(__dirname, "..", localFramePath);
    await downloadFile(frameImagePath, localFrameFilePath);

    const originalImage = sharp(localPath);
    const frameImage = sharp(localFramePath);
    const { width: imageWidth, height: imageHeight } = await sharp(
      localPath
    ).metadata();
    const targetWidth = imageWidth;
    const targetHeight = imageHeight;
    const resizedFrame = await frameImage
      .resize(targetWidth, targetHeight)
      .toBuffer();
    const outputDirectory = path.dirname(outputImagePath);
    await fs.promises.mkdir(outputDirectory, { recursive: true });
    const result = await originalImage
      .composite([{ input: resizedFrame }])
      .toFile(outputImagePath);

    const cloudinaryOptions = {
      public_id: filename,
      folder: `media/${phone}/saved`,
      resource_type: "image",
    };
    let upload_result;
    try {
      upload_result = await cloudinary.uploader.upload(
        outputImagePath,
        cloudinaryOptions
      );
    } catch (uploadError) {
      console.error("Error uploading to Cloudinary:", uploadError);
      return res.status(500).json({
        success: false,
        error: "Error uploading to Cloudinary.",
      });
    }
    const deleteFile1Path = path.join(
      __dirname,
      `../uploads/${phone}/saved`,
      filename
    );
    fs.unlinkSync(deleteFile1Path);
    const deleteFile2Path = path.join(
      __dirname,
      `../uploads/${phone}`,
      filename
    );
    fs.unlinkSync(deleteFile2Path);
    // const deleteFile3Path = path.join(__dirname, `../resizedFrame.png`);
    // fs.unlinkSync(deleteFile3Path);

    return res.status(200).json({
      success: true,
      message: "Frame added successfully to image.",
      fileUrl: upload_result.secure_url,
    });
  } catch (error) {
    console.error("Error adding frame:", error);
  }
};

// const addFrameToVideo = (
//   originalVideoPath,
//   frameImagePath,
//   outputVideoPath,
//   filename,
//   res,
//   phone
// ) => {
//   const ffprobe = require("ffprobe");
//   const ffprobePath = require("ffprobe-static").path;

//   ffprobe(originalVideoPath, { path: ffprobePath }, (err, info) => {
//     if (err) {
//       console.error("Error getting video dimensions:", err);
//       return;
//     }
//     const videoWidth = info.streams[0].width;
//     const videoHeight = info.streams[0].height;
//     const outputDirectory = path.dirname(outputVideoPath);

//     fs.mkdirSync(outputDirectory, { recursive: true });

//     ffmpeg()
//       .input(frameImagePath)
//       .videoFilters(`scale=${videoWidth}:${videoHeight}`)
//       .output("resizedFrame.png")
//       .on("end", () => {
//         ffmpeg()
//           .input(originalVideoPath)
//           .input("resizedFrame.png")
//           .complexFilter({
//             filter: "overlay",
//             options: {
//               x: "W-w-10",
//               y: "H-h-10",
//             },
//           })
//           .output(outputVideoPath)
//           .on("end", async () => {
//             const cloudinaryOptions = {
//               public_id: filename,
//               folder: `media/${phone}/saved`,
//               resource_type: "video",
//             };
//             let upload_result;
//             try {
//               upload_result = await cloudinary.uploader.upload(
//                 outputVideoPath,
//                 cloudinaryOptions
//               );
//             } catch (uploadError) {
//               console.error("Error uploading to Cloudinary:", uploadError);
//               return res.status(500).json({
//                 success: false,
//                 error: "Error uploading to Cloudinary.",
//               });
//             }

//             const deleteVideoPath = path.join(
//               __dirname,
//               `../uploads/${phone}/saved`,
//               filename
//             );
//             fs.unlinkSync(deleteVideoPath);
//             return res.status(200).json({
//               success: true,
//               message: "Frame added successfully to video.",
//               fileUrl: upload_result.secure_url,
//             });
//           })
//           .on("error", (err) => {
//             console.error("Error:", err);
//           })
//           .run();
//       })
//       .on("error", (err) => {
//         console.error("Error resizing frame:", err);
//       })
//       .run();
//   });
// };

// const addFrameToVideo = (
//   originalVideoPath,
//   frameImagePath,
//   outputVideoPath,
//   filename,
//   res,
//   phone
// ) => {
//   const ffprobe = require("ffprobe");
//   const ffprobePath = require("ffprobe-static").path;

//   ffprobe(originalVideoPath, { path: ffprobePath }, (err, info) => {
//     if (err) {
//       console.error("Error getting video dimensions:", err);
//       return;
//     }

//     const outputDirectory = path.dirname(outputVideoPath);

//     fs.mkdirSync(outputDirectory, { recursive: true });

//     ffmpeg()
//       .input(originalVideoPath)
//       .input(frameImagePath)
//       .complexFilter({
//         filter: "overlay",
//         options: {
//           x: "W-w-10",
//           y: "H-h-10",
//         },
//       })
//       .output(outputVideoPath)
//       .on("end", async () => {
//         const cloudinaryOptions = {
//           public_id: filename,
//           folder: `media/${phone}/saved`,
//           resource_type: "video",
//         };

//         let upload_result;
//         try {
//           upload_result = await cloudinary.uploader.upload(
//             outputVideoPath,
//             cloudinaryOptions
//           );
//         } catch (uploadError) {
//           console.error("Error uploading to Cloudinary:", uploadError);
//           return res.status(500).json({
//             success: false,
//             error: "Error uploading to Cloudinary.",
//           });
//         }

//         const deleteVideoPath = path.join(
//           __dirname,
//           `../uploads/${phone}/saved`,
//           filename
//         );
//         fs.unlinkSync(deleteVideoPath);

//         return res.status(200).json({
//           success: true,
//           message: "Frame added successfully to video.",
//           fileUrl: upload_result.secure_url,
//         });
//       })
//       .on("error", (err) => {
//         console.error("Error:", err);
//       })
//       .run();
//   });
// };

// const addFrameToVideo = async (
//   originalVideoPath,
//   frameImagePath,
//   outputVideoPath,
//   filename,
//   res,
//   phone
// ) => {
//   const ffprobe = require("ffprobe");
//   const ffprobePath = require("ffprobe-static").path;

//   const localPath = `uploads/${filename}`;
//   const localPathDir = path.dirname(localPath);
//   await fs.promises.mkdir(localPathDir, { recursive: true });
//   const localFilePath = path.resolve(__dirname, "..", localPath);
//   await downloadFile(originalVideoPath, localFilePath);
//   //downloading frame
//   const localFramePath = `uploads/${phone}/${filename}`;
//   const localFramePathDir = path.dirname(localFramePath);
//   await fs.promises.mkdir(localFramePathDir, { recursive: true });
//   const localFrameFilePath = path.resolve(__dirname, "..", localFramePath);
//   await downloadFile(frameImagePath, localFrameFilePath);

//   ffprobe(localFilePath, { path: ffprobePath }, (err, info) => {
//     if (err) {
//       console.error("Error getting video dimensions:", err);
//       return;
//     }

//     const outputDirectory = path.dirname(outputVideoPath);

//     fs.mkdirSync(outputDirectory, { recursive: true });

//     ffmpeg()
//       .input(localFilePath)
//       .input(localFrameFilePath)
//       .complexFilter({
//         filter: "overlay",
//         options: {
//           x: "W-w-10",
//           y: "H-h-10",
//         },
//       })
//       .output(outputVideoPath)
//       .on("end", async () => {
//         const cloudinaryOptions = {
//           public_id: filename,
//           folder: `media/${phone}/saved`,
//           resource_type: "video",
//         };

//         let upload_result;
//         try {
//           upload_result = await cloudinary.uploader.upload(
//             outputVideoPath,
//             cloudinaryOptions
//           );
//         } catch (uploadError) {
//           console.error("Error uploading to Cloudinary:", uploadError);
//           return res.status(500).json({
//             success: false,
//             error: "Error uploading to Cloudinary.",
//           });
//         }

//         // const deleteVideoPath = path.join(
//         //   __dirname,
//         //   `../uploads/${phone}/saved`,
//         //   filename
//         // );
//         // fs.unlinkSync(deleteVideoPath);

//         return res.status(200).json({
//           success: true,
//           message: "Frame added successfully to video.",
//           fileUrl: upload_result.secure_url,
//         });
//       })
//       .on("error", (err) => {
//         console.error("Error:", err);
//       })
//       .run();
//   });
// };

const addFrameToVideo = async (
  originalVideoPath,
  frameImagePath,
  outputVideoPath,
  filename,
  res,
  phone
) => {
  const ffprobe = require("ffprobe");
  const ffprobePath = require("ffprobe-static").path;

  const localPath = `uploads/${filename}`;
  const localPathDir = path.dirname(localPath);
  await fs.promises.mkdir(localPathDir, { recursive: true });
  const localFilePath = path.resolve(__dirname, "..", localPath);
  await downloadFile(originalVideoPath, localFilePath);
  //downloading frame
  const localFramePath = `uploads/${phone}/${filename}`;
  const localFramePathDir = path.dirname(localFramePath);
  await fs.promises.mkdir(localFramePathDir, { recursive: true });
  const localFrameFilePath = path.resolve(__dirname, "..", localFramePath);
  await downloadFile(frameImagePath, localFrameFilePath);

  ffprobe(localFilePath, { path: ffprobePath }, (err, info) => {
    if (err) {
      console.error("Error getting video dimensions:", err);
      return;
    }
    const videoWidth = info.streams[0].width;
    const videoHeight = info.streams[0].height;
    const outputDirectory = path.dirname(outputVideoPath);

    fs.mkdirSync(outputDirectory, { recursive: true });

    ffmpeg()
      .input(localFrameFilePath)
      .videoFilters(`scale=${videoWidth}:${videoHeight}`)
      .output("resizedFrame.png")
      .on("end", () => {
        ffmpeg()
          .input(localFilePath)
          .input("resizedFrame.png")
          .complexFilter({
            filter: "overlay",
            options: {
              x: "W-w-10",
              y: "H-h-10",
            },
          })
          .output(outputVideoPath)
          .on("end", async () => {
            const cloudinaryOptions = {
              public_id: filename,
              folder: `media/${phone}/saved`,
              resource_type: "video",
            };
            let upload_result;
            try {
              upload_result = await cloudinary.uploader.upload(
                outputVideoPath,
                cloudinaryOptions
              );
            } catch (uploadError) {
              console.error("Error uploading to Cloudinary:", uploadError);
              return res.status(500).json({
                success: false,
                error: "Error uploading to Cloudinary.",
              });
            }

            const deleteVideoPath = path.join(
              __dirname,
              `../uploads/${phone}/saved`,
              filename
            );
            fs.unlinkSync(deleteVideoPath);
            return res.status(200).json({
              success: true,
              message: "Frame added successfully to video.",
              fileUrl: upload_result.secure_url,
            });
          })
          .on("error", (err) => {
            console.error("Error:", err);
          })
          .run();
      })
      .on("error", (err) => {
        console.error("Error resizing frame:", err);
      })
      .run();
  });
};

router.post("/addFrame/:phone/:mediaName/:frameName", async (req, res) => {
  try {
    const { phone, mediaName, frameName } = req.params;
    const videoExtensions = [".mp4", ".avi", ".mkv", ".mov"];
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const fileType = mediaName.toLowerCase().split(".").pop();
    const uniqueId = uuidv4();

    if (videoExtensions.includes(`.${fileType}`)) {
      const fileExtension = "mp4";
      const filename = `${uniqueId}.${fileExtension}`;
      const outputVideoPath = `uploads/${phone}/saved/${filename}`;
      addFrameToVideo(
        mediaName,
        frameName,
        outputVideoPath,
        filename,
        res,
        phone
      );
    }
    if (imageExtensions.includes(`.${fileType}`)) {
      const fileExtension = "png";
      const filename = `${uniqueId}.${fileExtension}`;
      const outputImagePath = `uploads/${phone}/saved/${filename}`;
      await addFrameToImage(
        mediaName,
        frameName,
        outputImagePath,
        filename,
        phone,
        res
      );
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error." });
  }
});

router.post("/add-frames/:phone", upload.single("frame"), async (req, res) => {
  try {
    const { phone } = req.params;
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
      folder: `media/${phone}`,
      resource_type: "image",
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

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    user.frames.push({
      uniqueName: filename,
      cloudinaryUrl: result.secure_url,
      publicId: result.public_id,
    });
    await user.save();

    res.json({
      success: true,
      uploadedFile: { fileType, cloudinaryUrl: result.secure_url },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(
      "Error deleting resource from Cloudinary: error message: ",
      error.message
    );
  }
}

router.delete("/user/:phone/:uniqueName/:publicId", async (req, res) => {
  try {
    const { phone, uniqueName, publicId } = req.params;
    const user = await User.findOne({ phone });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const frameIndex = user.frames.findIndex(
      (frame) => frame.uniqueName === uniqueName
    );
    if (frameIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Frame not found" });
    }
    user.frames.splice(frameIndex, 1);
    await user.save();
    await deleteFromCloudinary(publicId);
    res
      .status(200)
      .json({ success: true, message: "Frame deleted successfully" });
  } catch (error) {
    console.error("Error deleting frame:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.post("/create", async (req, res) => {
  try {
    const { phone, email } = req.body;

    if (!phone || !email) {
      return res
        .status(400)
        .json({ success: false, error: "Phone and email are required" });
    }

    const newUser = new User({ phone, email });
    await newUser.save();

    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.delete("/delete/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }

    const deletedUser = await User.findOneAndDelete({ _id: userId });

    res.json({ success: true, deletedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const allUsers = await User.find();
    res.json({ success: true, users: allUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/user/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res
        .status(400)
        .json({ success: false, error: "Phone is required" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "piyushclientapp@gmail.com",
    pass: "txamjabdaagarodx",
  },
});

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

const otpStorage = {};

router.post("/send-otp/:email", (req, res) => {
  const { email } = req.params;
  if (!email) {
    return res.status(400).json({ error: "Missing email address" });
  }
  const otp = generateOTP();
  otpStorage[email] = otp;
  const mailOptions = {
    from: "DAGSUN",
    to: email,
    subject: "OTP Verification",
    text: `OTP for your verification is: ${otp}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      return res.status(200).json({ success: true });
    }
  });
});

router.get("/get-otp/:email", (req, res) => {
  const { email } = req.params;
  const storedOTP = otpStorage[email];
  if (storedOTP) {
    delete otpStorage[email];
    return res.status(200).json({ otp: storedOTP });
  } else {
    return res.status(404).json({ error: "OTP not found" });
  }
});

module.exports = router;
