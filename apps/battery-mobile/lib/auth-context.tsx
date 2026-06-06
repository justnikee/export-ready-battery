import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import api from "./api";
import type { User } from "./types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const savedToken = await SecureStore.getItemAsync("token");
      if (savedToken) {
        // Validate token by fetching user
        const response = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (response.data) {
          setToken(savedToken);
          setUser(response.data);
        } else {
          await SecureStore.deleteItemAsync("token");
        }
      }
    } catch {
      await SecureStore.deleteItemAsync("token");
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await api.post("/auth/login", { email, password });
    const { token: newToken, user: newUser } = response.data;
    await SecureStore.setItemAsync("token", newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function logout() {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
