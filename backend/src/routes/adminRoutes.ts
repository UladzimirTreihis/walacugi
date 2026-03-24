import { Router } from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const jwtSecret = process.env.JWT_SECRET;

  if (!password || !adminPasswordHash || !jwtSecret) {
    res.status(500).json({ error: "Missing auth configuration" });
    return;
  }

  const isMatch = await bcrypt.compare(password, adminPasswordHash);
  if (!isMatch) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ role: "admin" }, jwtSecret, { expiresIn: "24h" });
  res.json({ token });
});

router.post("/verify-token", async (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  const jwtSecret = process.env.JWT_SECRET;
  if (!token || !jwtSecret) {
    res.status(401).json({ valid: false });
    return;
  }

  jwt.verify(token, jwtSecret, (err) => {
    if (err) {
      res.status(403).json({ valid: false });
      return;
    }
    res.json({ valid: true });
  });
});

export default router;
