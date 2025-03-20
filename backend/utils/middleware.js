import jwt from "jsonwebtoken";

// Middleware to verify the admin token
export function checkAdminToken(req, res, next) {
  console.log("🔍 CHECKING TOKEN...");

  // 🔹 Extract token from the Authorization header
  const token = req.headers["authorization"]?.split(" ")[1];

  console.log("Token from back received: ", token)

  if (!token) {
    console.log("❌ No token provided!");
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  // 🔹 Verify the JWT token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("❌ Invalid Token:", err.message);
      return res.status(403).json({ error: "Invalid token" });
    }

    console.log("✅ Token Verified:", decoded);
    
    // Attach admin details (if needed for additional checks)
    req.admin = decoded; // { role: "admin" }

    next(); // Allow request to continue
  });
}
