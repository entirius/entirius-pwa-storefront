"use client";

import { createContext, useContext, useState } from "react";

type AuthContextValue = {
  isLoggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Per-request auth flag, seeded from the server's `at` cookie read (so it's
// correct at first paint — no hydration flash) and flipped client-side on
// login/logout. Shared across the header icon and the /profile route.
export function AuthProvider({
  initial,
  children,
}: {
  initial: boolean;
  children: React.ReactNode;
}) {
  const [isLoggedIn, setLoggedIn] = useState(initial);
  return (
    <AuthContext.Provider value={{ isLoggedIn, setLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
