import { Router, type IRouter } from "express";
import { eq, ilike, sql, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  ListUsersResponse,
  CreateUserBody,
  GetUserParams,
  GetUserResponse,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
  DeleteUserParams,
} from "@workspace/api-zod";
import { authMiddleware, requireRole, hashPassword, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/users", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { page = 1, limit = 20, search } = params.data;
  const offset = (page - 1) * limit;
  const { tenantId } = req.user!;

  const conditions: any[] = [];
  if (tenantId !== null) conditions.push(eq(usersTable.tenantId, tenantId));
  if (search) {
    conditions.push(
      sql`(${usersTable.name} ILIKE ${'%' + search + '%'} OR ${usersTable.email} ILIKE ${'%' + search + '%'})`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(whereClause);
  const total = countResult.count;

  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    active: usersTable.active,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(whereClause).limit(limit).offset(offset).orderBy(usersTable.createdAt);

  res.json({
    data: users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/users", authMiddleware, requireRole("super_admin"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tenantId } = req.user!;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already exists" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const [user] = await db.insert(usersTable).values({
    tenantId,
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: parsed.data.role,
  }).returning();

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/users/:id", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { tenantId } = req.user!;
  const conditions: any[] = [eq(usersTable.id, params.data.id)];
  if (tenantId !== null) conditions.push(eq(usersTable.tenantId, tenantId));

  const [user] = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    active: usersTable.active,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(and(...conditions)).limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

router.patch("/users/:id", authMiddleware, requireRole("super_admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tenantId } = req.user!;
  const conditions: any[] = [eq(usersTable.id, params.data.id)];
  if (tenantId !== null) conditions.push(eq(usersTable.tenantId, tenantId));

  const updateData: any = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
  if (parsed.data.active !== undefined) updateData.active = parsed.data.active;

  const [user] = await db.update(usersTable).set(updateData).where(and(...conditions)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
  });
});

router.delete("/users/:id", authMiddleware, requireRole("super_admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (params.data.id === req.user!.userId) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }

  const { tenantId } = req.user!;
  const conditions: any[] = [eq(usersTable.id, params.data.id)];
  if (tenantId !== null) conditions.push(eq(usersTable.tenantId, tenantId));

  const [user] = await db.delete(usersTable).where(and(...conditions)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
