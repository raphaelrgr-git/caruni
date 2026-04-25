import * as React from "react";
import * as api from "@/lib/api";
import type { SignupPayload, MeResponse } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  course: string | null;
  photoUrl: string | null;
  university: { id: string; name: string; city: string } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  signup(payload: SignupPayload): Promise<{ verificationToken: string }>;
  verifyEmail(token: string): Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function meToUser(me: MeResponse): AuthUser {
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    course: me.course,
    photoUrl: me.photoUrl,
    university: me.university,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .getMe()
      .then((me) => setUser(meToUser(me)))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const { user: me } = await api.login({ email, password });
    setUser(meToUser(me));
  }, []);

  const logout = React.useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const signup = React.useCallback(async (payload: SignupPayload) => {
    const res = await api.signup(payload);
    return { verificationToken: res.verificationToken };
  }, []);

  const verifyEmail = React.useCallback(async (token: string) => {
    await api.verifyEmail(token);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
    signup,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
