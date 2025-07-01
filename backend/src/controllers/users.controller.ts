import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from './audit.controller';
import bcrypt from 'bcryptjs';
import { ADMIN_PERMISSIONS, AdminPermission } from '../types/permissions';

const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const data = await db
      .select()
      .from(users)
      .limit(Number(limit))
      .offset(offset);

    const totalCount = await db.select({ count: users.id }).from(users);

    res.status(200).json({
      message: 'Users fetched successfully',
      status: 'success',
      error: null,
      data: {
        users: data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount.length,
          totalPages: Math.ceil(totalCount.length / Number(limit))
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await db.select().from(users).where(eq(users.id, id));
    if (data.length === 0) {
      res.status(404).json({
        message: 'User not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    res.status(200).json({
      message: 'User fetched successfully',
      status: 'success',
      error: null,
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};

const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username, email, phone_number, password, roles, role_name } = req.body;
    
    // Validate required fields
    if (!username || !email || !phone_number || !password || !roles || !Array.isArray(roles)) {
      res.status(400).json({
        message: 'All fields are required and roles must be an array',
        status: "error",
        error: "Missing or invalid fields",
        data: null,
      });
      return;
    }

    // Validate roles
    const invalidRoles = roles.filter((r: string) => !ADMIN_PERMISSIONS.includes(r as AdminPermission));
    if (invalidRoles.length > 0) {
      res.status(400).json({
        message: `Invalid roles: ${invalidRoles.join(', ')}`,
        status: "error",
        error: "Invalid roles",
        data: null,
      });
      return;
    }

    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.username, username));
    if (existing.length > 0) {
      res.status(409).json({
        message: 'Username already exists',
        status: "error",
        error: "Existing user",
        data: null,
      });
      return;
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
      username,
      email,
      phone_number,
      password_hash: hashedPassword,
      roles,
      role_name
    }).returning();

    // Create audit log entry
    await logAudit({
      tableName: 'users',
      action: 'INSERT',
      description: `Created new user: ${username}`,
      oldData: null,
      newData: newUser,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    // Return user without password
    const { password_hash, ...userWithoutPassword } = newUser;
    res.status(201).json({
      message: 'User created successfully',
      status: 'success',
      error: null,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { username, email, phone_number, role_name, roles } = req.body;
    
    // Get the current user data for audit logging
    const oldUser = await db.select().from(users).where(eq(users.id, id));
    if (oldUser.length === 0) {
      res.status(404).json({
        message: 'User not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Build update object with only provided fields
    const updateData: any = { updatedAt: new Date() };
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (role_name !== undefined) updateData.role_name = role_name;
    if (roles !== undefined) updateData.roles = roles;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updated) {
      res.status(404).json({
        message: 'User not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Create audit log entry
    await logAudit({
      tableName: 'users',
      action: 'UPDATE',
      description: `Updated user: ${oldUser[0].username}`,
      oldData: oldUser[0] || null,
      newData: updated,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    res.status(200).json({
      message: 'User updated successfully',
      status: 'success',
      error: null,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const oldUser = await db.select().from(users).where(eq(users.id, id));
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
    if (!deleted) {
      res.status(404).json({
        message: 'User not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    await logAudit({
      tableName: 'users',
      action: 'DELETE',
      description: 'Deleted user',
      oldData: oldUser[0] || null,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(200).json({
      message: 'User deleted successfully',
      status: 'success',
      error: null,
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
};

export default { get, getById, create, update, remove };