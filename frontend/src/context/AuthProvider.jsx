import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  useEffect(() => {
    if (!session) return;
    let expiry;
    try { expiry = JSON.parse(atob(session.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000; } catch { expiry = Date.now(); }
    const timer = setTimeout(() => setSession(null), Math.max(0, Math.min(2147483647, (expiry || Date.now()) - Date.now())));
    return () => clearTimeout(timer);
  }, [session]);
  return <AuthContext.Provider value={{ user: session?.user ?? null, token: session?.token ?? null, login: (user, token) => setSession({user, token}), logout: () => setSession(null) }}>{children}</AuthContext.Provider>;
}
