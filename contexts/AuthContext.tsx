"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import { UserPermission, USER_PERMISSIONS } from "@/types/permissions";

interface User {
	id: number;
	username: string;
	email?: string;
	phone_number?: string;
	role_name?: string;
	roles: string[];
	createdAt?: string;
	updatedAt?: string;
}

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	login: (userData: User) => void;
	logout: () => void;
	updateUser: (userData: Partial<User>) => void;
	isLoading: boolean;
	hasPermission: (permission: UserPermission) => boolean;
	hasAnyPermission: (permissions: UserPermission[]) => boolean;
	hasAllPermissions: (permissions: UserPermission[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	isAuthenticated: false,
	login: () => {},
	logout: () => {},
	updateUser: () => {},
	isLoading: true,
	hasPermission: () => false,
	hasAnyPermission: () => false,
	hasAllPermissions: () => false,
});

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [user, setUser] = useState<User | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function fetchSession() {
			try {
				const axios = (await import("axios")).default;
				const res = await axios.get("/api/auth/session", {
					withCredentials: true,
				});
				const data = res.data;
				if (data.authenticated) {
					setUser(data.user);
					setIsAuthenticated(true);
				} else {
					setUser(null);
					setIsAuthenticated(false);
				}
			} catch {
				setUser(null);
				setIsAuthenticated(false);
			} finally {
				setIsLoading(false);
			}
		}
		fetchSession();
	}, []);

	const login = (userData: User) => {
		setUser(userData);
		setIsAuthenticated(true);
	};

	const logout = () => {
		setUser(null);
		setIsAuthenticated(false);
	};

	const updateUser = (userData: Partial<User>) => {
		if (user) {
			const updatedUser = { ...user, ...userData };
			setUser(updatedUser);
			// localStorage.setItem("user", JSON.stringify(updatedUser));
		}
	};

	// Role-based permission helpers
	const hasPermission = (permission: UserPermission): boolean => {
		if (!user || !user.roles) return false;
		return user.roles.includes(permission);
	};

	const hasAnyPermission = (permissions: UserPermission[]): boolean => {
		if (!user || !user.roles) return false;
		return permissions.some(permission => user.roles.includes(permission));
	};

	const hasAllPermissions = (permissions: UserPermission[]): boolean => {
		if (!user || !user.roles) return false;
		return permissions.every(permission => user.roles.includes(permission));
	};

	return (
		<AuthContext.Provider
			value={{ 
				user, 
				isAuthenticated, 
				login, 
				logout, 
				updateUser, 
				isLoading,
				hasPermission,
				hasAnyPermission,
				hasAllPermissions,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
