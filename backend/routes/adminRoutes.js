import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

// Middleware to verify the token
// function checkAdminToken(req, res, next) {
//     console.log("CHECKING TOKEN \n")
//   const token = req.headers["authorization"]?.split(" ")[1];
//   if (!token) return res.status(401).json({ error: "Unauthorized" });

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) return res.status(403).json({ error: "Invalid token" });

//     req.admin = decoded; // Attach admin data
//     next();
//   });
// }

// POST /admin/login → Authenticate admin
router.post("/login", async (req, res) => {
  const { password } = req.body;

  console.log("Entered Password:", password);

  // 🔹 Compare entered password with the hashed password from .env
  const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  console.log("Password Match:", isMatch);

  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // 🔹 Generate a JWT token (valid for 24 hours)
  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "24h" });

  console.log("Generated Token:", token);
  res.json({ token });
});

router.post("/verify-token", async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(401).json({ valid: false });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ valid: false });

    res.json({ valid: true });
  });
});


// export { checkAdminToken };
export default router;
