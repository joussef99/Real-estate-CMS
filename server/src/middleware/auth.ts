import jwt, { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}
const JWT_SECRET = process.env.JWT_SECRET;

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
  console.log("Token:", token);
  if (!token) {
    console.warn(`[AUTH] Missing or malformed Authorization header for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = {
      ...decoded,
      role: normalizeRole(decoded.role),
    };
    console.log("User:", req.user);
    next();
  } catch (err) {
    console.warn(`[AUTH] Invalid token for ${req.method} ${req.originalUrl}`);
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: Request & { user?: AuthUser }, res: Response, next: NextFunction) {
  console.log("User:", req.user);

  if (!req.user) {
    console.warn(`[AUTH] Admin check failed: missing user for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: "Unauthorized" });
  }

  const normalizedRole = normalizeRole(req.user.role);
  if (normalizedRole !== "admin") {
    console.warn(
      `[AUTH] Admin check failed: role=${normalizedRole || "<empty>"} for ${req.method} ${req.originalUrl}`,
    );
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
