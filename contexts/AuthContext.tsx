"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";

interface User {
	id: number;
	username: string;
	email?: string;
	phone_number?: string;
	role?: string;
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
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	isAuthenticated: false,
	login: () => {},
	logout: () => {},
	updateUser: () => {},
	isLoading: true,
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
				const res = await fetch("/api/auth/session", {
					credentials: "include",
					method: "GET",
				});
				if (res.ok) {
					const data = await res.json();
					if (data.authenticated) {
						setUser(data.user);
						setIsAuthenticated(true);
					} else {
						setUser(null);
						setIsAuthenticated(false);
					}
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

	return (
		<AuthContext.Provider
			value={{ user, isAuthenticated, login, logout, updateUser, isLoading }}
		>
			{children}
		</AuthContext.Provider>
	);
};
