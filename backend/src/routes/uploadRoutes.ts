import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { checkAdminToken } from "../utils/middleware.js";
import { HttpError } from "../utils/httpErrors.js";

const router = Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ""
  }
});

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new HttpError(400, "Unsupported image type"));
      return;
    }
    cb(null, true);
  }
});

const safeKey = (folder: string, originalName: string): string => {
  const match = originalName.match(/\.[a-z0-9]+$/i);
  const ext = match ? match[0].toLowerCase() : "";
  return `${folder}/${Date.now()}-${randomUUID()}${ext}`;
};

const getPublicUrl = (key: string): string => {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

const uploadImages = async (
  files: Express.Multer.File[],
  folder: "news" | "events" | "equipment"
): Promise<string[]> => {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new HttpError(500, "Storage is not configured");
  }

  const uploaded = await Promise.all(
    files.map(async (file) => {
      const key = safeKey(folder, file.originalname);
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

function handleUpload(folder: "news" | "events" | "equipment") {
  return [
    checkAdminToken,
    (req: Request, res: Response, next: NextFunction) => {
      upload.array("images", MAX_FILES)(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(new HttpError(413, "File too large. Max 20 MB per file."));
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return next(new HttpError(400, `Too many files. Max ${MAX_FILES}.`));
          }
          return next(new HttpError(400, "Invalid upload"));
        }
        return next(err);
      });
    },
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
          throw new HttpError(400, "No files uploaded");
        }
        const filePaths = await uploadImages(req.files as Express.Multer.File[], folder);
        res.json({ filePaths });
      } catch (err) {
        next(err);
      }
    }
  ];
}

router.post("/news-image", ...handleUpload("news"));
router.post("/event-image", ...handleUpload("events"));
router.post("/equipment-image", ...handleUpload("equipment"));

export default router;
