import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable, tokenBlacklistTable } from "@workspace/db";
import { eq } from "drizzle-orm";

import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString("hex");
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString("hex");

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.warn("WARNING: JWT_SECRET or JWT_REFRESH_SECRET not set. Using random secrets (tokens won't persist across restarts).");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): { userId: number; role: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
}

export function verifyRefreshToken(token: string): { userId: number } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: number };
}

export interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authorization required" });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const [blacklisted] = await db.select().from(tokenBlacklistTable).where(eq(tokenBlacklistTable.token, token)).limit(1);
    if (blacklisted) {
      res.status(401).json({ error: "Token has been revoked" });
      return;
    }

    const decoded = verifyAccessToken(token);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.userId)).limit(1);
    if (!user || !user.active) {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
