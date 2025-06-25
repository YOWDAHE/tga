import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AdminPermission } from '../types/permissions';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';


export interface JwtPayload {
    id: number;
    username: string;
    roles: AdminPermission[];
}

export function generateToken(payload: JwtPayload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.status(401).json({
            message: 'No token provided',
            error: "Authorization header is missing",
            status: "error",
            data: null,
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({
            message: 'Token missing',
            error: "Token is missing from the authorization header",
            status: "error",
            data: null,
        });
        return;
    }
    try {
        const user = verifyToken(token);
        req.user = user;
        next();
    } catch (err) {
        res.status(403).json({
            message: 'Invalid or expired token',
            error: err,
            status: "error",
            data: null,
         });
        return;
    }
}

// Middleware to check for specific permissions
export function authorizePermissions(...permissions: AdminPermission[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.roles.some((role: AdminPermission) => permissions.includes(role))) {
            res.status(403).json({
                error: 'Forbidden: insufficient permissions',
                message: "You do not not have the required permissions",
                status: "error",
                data: null,
             });
            return;
        }
        next();
    };
}

export function generateRefreshToken(payload: JwtPayload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
