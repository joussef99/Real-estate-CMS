import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}
const JWT_SECRET = process.env.JWT_SECRET;

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function getJWTSecret() {
  return JWT_SECRET;
}
