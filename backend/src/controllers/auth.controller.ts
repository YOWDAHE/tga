import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateRefreshToken, generateToken, JwtPayload, verifyAccessToken, verifyRefreshToken } from '../middlewares/jwtAuth';
import { eq } from 'drizzle-orm';
// Import your db instance and users table
import { db } from '../db';
import { users } from '../db/schema';
import { ADMIN_PERMISSIONS, AdminPermission } from '../types/permissions';
import { create } from 'domain';

export async function signUp(req: Request, res: Response) {
    // console.log('SignUp request body:', req.body);
    const { username, email, phone_number, password, roles, role_name } = req.body;
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
    try {
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
        const hashedPassword = await bcrypt.hash(password, 10);
        const [user] = await db.insert(users).values({
            username,
            email,
            phone_number,
            password_hash: hashedPassword,
            roles,
            role_name
        }).returning();
        const payload: JwtPayload = { id: user.id, username: user.username, roles: user.roles as AdminPermission[] };
        const token = generateToken(payload);
        const refreshToken = generateRefreshToken(payload);
        const { password_hash, ...userWithoutPassword } = user;
        res.status(200).json({
            message: 'Sign up successful',
            status: "success",
            error: null,
            data: {
                accessToken: token,
                refreshToken,
                user: userWithoutPassword,
            },
        });
        console.log("Res 2:", res);
    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err,
            status: "error",
            data: null,
        });
    }
}

export async function signIn(req: Request, res: Response) {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({
            error: "Validation error",
            status: "error",
            data: null,
            message: 'Username and password required'
        });
        return;
    }
    try {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        if (!user) {
            res.status(401).json({
                message: 'Invalid credentials',
                error: "This user does not exist",
                status: "error",
                data: null,
            });
            return;
        }
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            res.status(401).json({
                message: 'Invalid credentials',
                error: "The passward is incorrect",
                status: "error",
                data: null,
            });
            return;
        }
        const payload = { id: user.id, username: user.username, roles: user.roles as AdminPermission[] };
        const { password_hash, ...userWithoutPassword } = user; 
        const token = generateToken(payload);
        const refreshToken = generateRefreshToken(payload);
        res.json({
            message: 'Login successful',
            status: "success",
            error: null,
            data: {
                accessToken: token,
                refreshToken,
                user: userWithoutPassword,
            },
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
}

export async function refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(400).json({ message: 'Refresh token required' });
        return;
    }
    try {
        const user = verifyRefreshToken(refreshToken);
        
        const newAccessToken = generateToken({
            id: user.id,
            username: user.username,
            roles: user.roles,
        });
        const [finalUser] = await db.select().from(users).where(eq(users.id, user.id));
        const { password_hash, ...userWithoutPassword } = finalUser;

        res.json({
            token: newAccessToken,
            message: 'Server error',
            error: null,
            status: "error",
            data: {
                accessToken: newAccessToken,
                refreshToken,
                user: userWithoutPassword,
            },
        });
    } catch (err) {
        res.status(403).json({
            message: 'Invalid or expired refresh token',
            error: err,
            status: "error",
            data: null,
        });
        return;
    }
}

export async function me(req: Request, res: Response) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                message: "Authorization token missing",
                error: "Unauthorized",
                status: "error",
                data: null,
            });
            return;
        }

        const token = authHeader.split(" ")[1];
        const payload = verifyAccessToken(token);

        // Payload should contain user id or username
        const userId = payload.id;

        const [user] = await db.select().from(users).where(eq(users.id, userId));

        if (!user) {
            res.status(404).json({
                message: "User not found",
                error: "Not found",
                status: "error",
                data: null,
            });
            return;
        }

        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            message: "User info fetched successfully",
            status: "success",
            error: null,
            data: userWithoutPassword,
        });
        return;
    } catch (err) {
        res.status(401).json({
            message: "Invalid or expired token",
            error: err,
            status: "error",
            data: null,
        });
        return;
    }
  }