import jwt, { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { validateEnv } from "../lib/env-validation.ts";

// Cache validated JWT secret at module load
const JWT_SECRET = (() => {
  try {
    return validateEnv().jwtSecret;
  } catch (err) {
    process.stderr.write(`[ERROR] Failed to initialize JWT_SECRET from env\n`);
    throw err;
  }
})();

type AuthUser = JwtPayload & {
  id: number;
  username: string;
  role: string;
};

function normalizeRole(role: unknown): string {
  return typeof role === "string" ? role.trim().toLowerCase() : "";
}

function extractBearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return token;
}

export function authenticate(req: Request & { user?: AuthUser }, res: Response, next: NextFunction) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = {
      ...decoded,
      role: normalizeRole(decoded.role),
    };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: Request & { user?: AuthUser }, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const normalizedRole = normalizeRole(req.user.role);
  if (normalizedRole !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  req.user = {
    ...req.user,
    role: normalizedRole,
  };

  next();
}

export function getJWTSecret() {
  return JWT_SECRET;
}
