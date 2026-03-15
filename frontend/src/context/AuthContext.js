'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

const AuthContext = createContext({ isAuthorized: false, isAdmin: false, loading: true });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }) {
  const { isSignedIn, getToken } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (!isSignedIn) {
        setIsAuthorized(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/auth/check`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsAuthorized(data.authorized);
          setIsAdmin(data.admin);
        } else {
          setIsAuthorized(false);
          setIsAdmin(false);
        }
      } catch {
        setIsAuthorized(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [isSignedIn, getToken]);

  return (
    <AuthContext.Provider value={{ isAuthorized, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthorized() {
  return useContext(AuthContext);
}
