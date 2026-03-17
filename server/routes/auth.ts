import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/database.ts";
import { authenticate, getJWTSecret } from "../middleware/auth.ts";

const router = Router();
const JWT_SECRET = getJWTSecret();

// Login route
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username } });
});

router.post("/change-password", authenticate, async (req: any, res) => {
  const userId = Number(req.user?.id);
  const oldPassword = typeof req.body?.oldPassword === "string" ? req.body.oldPassword : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Old password and new password are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters long" });
  }

  const user = db.prepare("SELECT id, password FROM users WHERE id = ?").get(userId) as { id: number; password: string } | undefined;

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isOldPasswordValid) {
    return res.status(401).json({ error: "Old password is incorrect" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, userId);

  return res.json({ success: true, message: "Password updated successfully" });
});

export default router;
