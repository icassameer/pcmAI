import { Router, type IRouter } from "express";
import { eq, lt } from "drizzle-orm";
import { db, usersTable, refreshTokensTable, tokenBlacklistTable } from "@workspace/db";
import {
  LoginBody,
  LoginResponse,
  RefreshTokenBody,
  RefreshTokenResponse,
  LogoutResponse,
  GetMeResponse,
} from "@workspace/api-zod";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  authMiddleware,
  type AuthRequest,
} from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    res.status(401).json({ error: "Account is locked. Try again later." });
    return;
  }

  if (!user.active) {
    res.status(401).json({ error: "Account is inactive" });
    return;
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    const attempts = user.failedLoginAttempts + 1;
    const updates: any = { failedLoginAttempts: attempts };
    if (attempts >= 5) {
      updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id));
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  await db.update(usersTable).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(usersTable.id, user.id));

  const accessToken = generateAccessToken(user.id, user.role, user.tenantId);
  const refreshToken = generateRefreshToken(user.id);

  await db.insert(refreshTokensTable).values({
    token: refreshToken,
    userId: user.id,
    tenantId: user.tenantId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const parsed = RefreshTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const decoded = verifyRefreshToken(parsed.data.refreshToken);
    const [stored] = await db.select().from(refreshTokensTable).where(eq(refreshTokensTable.token, parsed.data.refreshToken)).limit(1);

    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.userId)).limit(1);
    if (!user || !user.active) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.token, parsed.data.refreshToken));

    const accessToken = generateAccessToken(user.id, user.role, user.tenantId);
    const refreshToken = generateRefreshToken(user.id);

    await db.insert(refreshTokensTable).values({
      token: refreshToken,
      userId: user.id,
      tenantId: user.tenantId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        active: user.active,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }
});

router.post("/auth/logout", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const token = req.headers.authorization!.substring(7);
  await db.insert(tokenBlacklistTable).values({
    token,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  }).onConflictDoNothing();

  await db.delete(refreshTokensTable).where(eq(refreshTokensTable.userId, req.user!.userId));

  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
