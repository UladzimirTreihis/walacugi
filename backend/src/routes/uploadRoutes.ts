import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { checkAdminToken } from "../utils/middleware.js";

const router = Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ""
  }
});

const upload = multer({ storage: multer.memoryStorage() });

const getPublicUrl = (key: string): string => {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

const uploadImages = async (files: Express.Multer.File[], folder: "news" | "events" | "equipment"): Promise<string[]> => {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error("Missing AWS_S3_BUCKET");
  }

  const uploaded = await Promise.all(
    files.map(async (file) => {
      const key = `${folder}/${Date.now()}-${file.originalname}`;
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      });
      await s3.send(command);
      return getPublicUrl(key);
    })
  );

  return uploaded;
};

router.post("/news-image", checkAdminToken, upload.array("images", 10), async (req: Request, res: Response) => {
  if (!req.files || req.files.length === 0) {
    res.status(400).json({ error: "No files uploaded" });
    return;
  }

  try {
    const filePaths = await uploadImages(req.files as Express.Multer.File[], "news");
    res.json({ filePaths });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/event-image", checkAdminToken, upload.array("images", 10), async (req: Request, res: Response) => {
  if (!req.files || req.files.length === 0) {
    res.status(400).json({ error: "No files uploaded" });
    return;
  }

  try {
    const filePaths = await uploadImages(req.files as Express.Multer.File[], "events");
    res.json({ filePaths });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/equipment-image", checkAdminToken, upload.array("images", 10), async (req: Request, res: Response) => {
  if (!req.files || req.files.length === 0) {
    res.status(400).json({ error: "No files uploaded" });
    return;
  }

  try {
    const filePaths = await uploadImages(req.files as Express.Multer.File[], "equipment");
    res.json({ filePaths });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
