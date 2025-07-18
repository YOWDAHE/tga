import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateRefreshToken, generateToken, JwtPayload, verifyAccessToken, verifyRefreshToken } from '../middlewares/jwtAuth';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { apiUsers } from '../db/schema';

export async function apiSignUp(req: Request, res: Response) {
    const { username, email, phone_number, password } = req.body;
    
    if (!username || !email || !phone_number || !password) {
        res.status(400).json({
            message: 'All fields are required',
            status: "error",
            error: "Missing fields",
            data: null,
        });
        return;
    }

    try {
        // Check if username already exists
        const existingUsername = await db.select().from(apiUsers).where(eq(apiUsers.username, username));
        if (existingUsername.length > 0) {
            res.status(409).json({
                message: 'Username already exists',
                status: "error",
                error: "Existing username",
                data: null,
            });
            return;
        }

        // Check if email already exists
        const existingEmail = await db.select().from(apiUsers).where(eq(apiUsers.email, email));
        if (existingEmail.length > 0) {
            res.status(409).json({
                message: 'Email already exists',
                status: "error",
                error: "Existing email",
                data: null,
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [user] = await db.insert(apiUsers).values({
            username,
            email,
            phone_number,
            password_hash: hashedPassword,
            is_active: true,
        }).returning();

        const payload: JwtPayload = { 
            id: user.id, 
            username: user.username, 
            roles: ['API_USER'] 
        };
        
        const token = generateToken(payload);
        const refreshToken = generateRefreshToken(payload);
        
        const { password_hash, ...userWithoutPassword } = user;
        
        res.status(201).json({
            message: 'API user sign up successful',
            status: "success",
            error: null,
            data: {
                accessToken: token,
                refreshToken,
                user: userWithoutPassword,
            },
        });
    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err,
            status: "error",
            data: null,
        });
    }
}

export async function apiSignIn(req: Request, res: Response) {
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
        const [user] = await db.select().from(apiUsers).where(eq(apiUsers.username, username));
        
        if (!user) {
            res.status(401).json({
                message: 'Invalid credentials',
                error: "User does not exist",
                status: "error",
                data: null,
            });
            return;
        }

        // Check if user is active
        if (!user.is_active) {
            res.status(401).json({
                message: 'Account is deactivated',
                error: "Account inactive",
                status: "error",
                data: null,
            });
            return;
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            res.status(401).json({
                message: 'Invalid credentials',
                error: "Password is incorrect",
                status: "error",
                data: null,
            });
            return;
        }

        // Update last login
        await db.update(apiUsers)
            .set({ last_login: new Date() })
            .where(eq(apiUsers.id, user.id));

        const payload: JwtPayload = { 
            id: user.id, 
            username: user.username, 
            roles: ['API_USER'] 
        };
        
        const { password_hash, ...userWithoutPassword } = user;
        const token = generateToken(payload);
        const refreshToken = generateRefreshToken(payload);
        
        res.json({
            message: 'API user login successful',
            status: "success",
            error: null,
            data: {
                accessToken: token,
                refreshToken,
                user: userWithoutPassword,
            },
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Server error', 
            error: err,
            status: "error",
            data: null,
        });
    }
}

export async function apiRefreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        res.status(400).json({ 
            message: 'Refresh token required',
            status: "error",
            error: "Missing refresh token",
            data: null,
        });
        return;
    }
    
    try {
        const user = verifyRefreshToken(refreshToken);
        
        // Verify the user still exists and is active
        const [apiUser] = await db.select().from(apiUsers).where(eq(apiUsers.id, user.id));
        
        if (!apiUser || !apiUser.is_active) {
            res.status(401).json({
                message: 'User not found or inactive',
                error: "Invalid user",
                status: "error",
                data: null,
            });
            return;
        }
        
        const newAccessToken = generateToken({
            id: user.id,
            username: user.username,
            roles: ['API_USER'],
        });
        
        const { password_hash, ...userWithoutPassword } = apiUser;

        res.json({
            message: 'Token refreshed successfully',
            error: null,
            status: "success",
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
    }
}

export async function apiMe(req: Request, res: Response) {
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

        const userId = payload.id;
        const [user] = await db.select().from(apiUsers).where(eq(apiUsers.id, userId));

        if (!user || !user.is_active) {
            res.status(404).json({
                message: "User not found or inactive",
                error: "Not found",
                status: "error",
                data: null,
            });
            return;
        }

        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            message: 'User profile retrieved successfully',
            status: "success",
            error: null,
            data: userWithoutPassword,
        });
    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err,
            status: "error",
            data: null,
        });
    }
} 