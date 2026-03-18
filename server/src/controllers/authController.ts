import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { getJWTSecret } from "../middleware/auth.ts";

const JWT_SECRET = getJWTSecret();

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;

  if (typeof username !== "string" || typeof password !== "string") {
    console.warn("[AUTH] Login failed: username or password missing/invalid type");
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    console.warn(`[AUTH] Login failed: user not found (${username})`);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    console.warn(`[AUTH] Login failed: invalid password (${username})`);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
}

export async function changePassword(req: any, res: Response) {
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isOldPasswordValid) {
    return res.status(401).json({ error: "Old password is incorrect" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return res.json({ success: true, message: "Password updated successfully" });
}
