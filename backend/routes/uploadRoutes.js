import { Router } from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import AWS from "aws-sdk";
import { checkAdminToken } from "../utils/middleware.js"


dotenv.config();
const router = Router();


// Configure S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multer.memoryStorage(), // Store in memory before upload
});


// router.post("/news-image", checkAdminToken, upload.single("image"), async (req, res) => {
//   if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//   const params = {
//     Bucket: process.env.AWS_S3_BUCKET,
//     Key: `news/${Date.now()}-${req.file.originalname}`,
//     Body: req.file.buffer,
//     ContentType: req.file.mimetype,
//     ACL: "public-read", // Makes it publicly accessible
//   };

//   try {
//     const uploadedFile = await s3.upload(params).promise();
//     res.json({ filePath: uploadedFile.Location });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

router.post("/news-image", checkAdminToken, upload.array("images", 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    const uploadPromises = req.files.map(async (file) => {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `news/${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      };

      const uploadedFile = await s3.upload(params).promise();
      return uploadedFile.Location;
    });

    const uploadedFilePaths = await Promise.all(uploadPromises);
    res.json({ filePaths: uploadedFilePaths });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload event images to S3
router.post("/event-image", checkAdminToken, upload.array("images", 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    const uploadPromises = req.files.map(async (file) => {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `events/${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      };

      const uploadedFile = await s3.upload(params).promise();
      return uploadedFile.Location;
    });

    const uploadedFilePaths = await Promise.all(uploadPromises);
    res.json({ filePaths: uploadedFilePaths });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
