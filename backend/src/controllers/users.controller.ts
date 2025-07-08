import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, like, or, and } from 'drizzle-orm';
import { logAudit } from './audit.controller';
import bcrypt from 'bcryptjs';
import { ADMIN_PERMISSIONS, AdminPermission } from '../types/permissions';

const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build where conditions for search
    const conditions = [];
    
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(users.username, searchTerm),
          like(users.email, searchTerm),
          like(users.phone_number, searchTerm),
          like(users.role_name, searchTerm)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(users)
      .where(whereClause)
      .limit(Number(limit))
      .offset(offset);

    // Get total count for pagination with search
    const totalCount = await db
      .select({ count: users.id })
      .from(users)
      .where(whereClause);

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

    // Check if username is being changed and if it already exists
    if (username && username !== oldUser[0].username) {
      const existingUser = await db.select().from(users).where(eq(users.username, username));
      if (existingUser.length > 0) {
        res.status(409).json({
          message: 'Username already exists',
          status: 'error',
          error: 'Username taken',
          data: null,
        });
        return;
      }
    }

    // Build update object with only provided fields
    const updateData: any = { updatedAt: new Date() };
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (role_name !== undefined) updateData.role_name = role_name;
    if (roles !== undefined) updateData.roles = roles;

    console.log(updateData)
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
      description: `Updated user account: ${oldUser[0].username}`,
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

// Get current user's profile
const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        message: 'Unauthorized',
        status: 'error',
        error: 'Authentication required',
        data: null,
      });
      return;
    }

    const userData = await db.select().from(users).where(eq(users.id, req.user.id));
    if (userData.length === 0) {
      res.status(404).json({
        message: 'User not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Return user without password
    const { password_hash, ...userWithoutPassword } = userData[0];
    res.status(200).json({
      message: 'Profile fetched successfully',
      status: 'success',
      error: null,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

// Update current user's profile
const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        message: 'Unauthorized',
        status: 'error',
        error: 'Authentication required',
        data: null,
      });
      return;
    }

    console.log(`update profile: ${req.body}, with token: ${req.user?.id}`)

    const { username, email, phone_number } = req.body;
    
    // Get current user data for audit logging
    const oldUser = await db.select().from(users).where(eq(users.id, req.user.id));
    if (oldUser.length === 0) {
      res.status(404).json({
        message: 'User not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Check if username is being changed and if it already exists
    if (username && username !== oldUser[0].username) {
      const existingUser = await db.select().from(users).where(eq(users.username, username));
      if (existingUser.length > 0) {
        res.status(409).json({
          message: 'Username already exists',
          status: 'error',
          error: 'Username taken',
          data: null,
        });
        return;
      }
    }

    // Build update object
    const updateData: any = { updatedAt: new Date() };
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, req.user.id))
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
      description: 'Updated profile information',
      oldData: oldUser[0],
      newData: updated,
      user_id: req.user.id,
      changedBy: req.user.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    // Return user without password
    const { password_hash, ...userWithoutPassword } = updated;
    res.status(200).json({
      message: 'Profile updated successfully',
      status: 'success',
      error: null,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

// Change current user's password
const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        message: 'Unauthorized',
        status: 'error',
        error: 'Authentication required',
        data: null,
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        message: 'Current password and new password are required',
        status: 'error',
        error: 'Missing fields',
        data: null,
      });
      return;
    }

    // Get current user data
    const userData = await db.select().from(users).where(eq(users.id, req.user.id));
    if (userData.length === 0) {
      res.status(404).json({
        message: 'User not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData[0].password_hash);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        message: 'Current password is incorrect',
        status: 'error',
        error: 'Invalid password',
        data: null,
      });
      return;
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const [updated] = await db
      .update(users)
      .set({ 
        password_hash: hashedNewPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, req.user.id))
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
      description: 'Changed password',
      oldData: { ...userData[0], password_hash: '[HIDDEN]' },
      newData: { ...updated, password_hash: '[HIDDEN]' },
      user_id: req.user.id,
      changedBy: req.user.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    res.status(200).json({
      message: 'Password changed successfully',
      status: 'success',
      error: null,
      data: { message: 'Password updated' },
    });
  } catch (error) {
    next(error);
  }
};

export default { get, getById, create, update, remove, getProfile, updateProfile, changePassword };