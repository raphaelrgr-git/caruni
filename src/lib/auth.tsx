import * as React from "react";
import * as api from "@/lib/api";
import type { SignupPayload, MeResponse } from "@/lib/api";
import type { UserRole } from "@/lib/types";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  course: string | null;
  photoUrl: string | null;
  bio: string | null;
  birthYear: number | null;
  petsPref: string | null;
  baggageSize: string | null;
  temperaturePref: string | null;
  restrictions: string | null;
  socialStyle: string | null;
  conversationStyle: string | null;
  musicPref: string | null;
  chatPref: string | null;
  punctualityPref: string | null;
  interests: string[];
  university: { id: string; name: string; city: string } | null;
  vehicle: MeResponse["vehicle"];
  isEmailVerified: boolean;
  drivenRoutesCount: number;
  onboarding: MeResponse["onboarding"];
  streak: MeResponse["streak"];
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshMe(): Promise<void>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  signup(payload: SignupPayload): Promise<{ verificationToken: string }>;
  verifyEmail(token: string): Promise<void>;
  setUserFromMe(me: MeResponse): void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function meToUser(me: MeResponse): AuthUser {
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    role: me.role,
    course: me.course,
    photoUrl: me.photoUrl,
    bio: me.bio ?? null,
    birthYear: me.birthYear ?? null,
    petsPref: me.petsPref ?? null,
    baggageSize: me.baggageSize ?? null,
    temperaturePref: me.temperaturePref ?? null,
    restrictions: me.restrictions ?? null,
    socialStyle: me.socialStyle ?? null,
    conversationStyle: me.conversationStyle ?? null,
    musicPref: me.musicPref ?? null,
    chatPref: me.chatPref ?? null,
    punctualityPref: me.punctualityPref ?? null,
    interests: me.interests ?? [],
    university: me.university,
    vehicle: me.vehicle,
    isEmailVerified: me.isEmailVerified,
    drivenRoutesCount: me.drivenRoutesCount,
    onboarding:
      me.onboarding ??
      ({
        passengerSeen: false,
        driverSeen: false,
        shouldShow: false,
      } satisfies MeResponse["onboarding"]),
    streak: me.streak ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshMe = React.useCallback(async () => {
    const me = await api.getMe();
    setUser(meToUser(me));
  }, []);

  React.useEffect(() => {
    refreshMe()
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, [refreshMe]);

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

  const setUserFromMe = React.useCallback((me: MeResponse) => {
    setUser(meToUser(me));
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    refreshMe,
    login,
    logout,
    signup,
    verifyEmail,
    setUserFromMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
