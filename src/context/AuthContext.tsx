'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole, User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  users: User[];
  switchUser: (userId: number) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  role: 'pemilik',
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  users: [],
  switchUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        // Cek sesi autentikasi ke server
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
          }
        } else {
          // Jika tidak ada cookie auth, cek localStorage
          const localSaved = localStorage.getItem('epicphone_auth_user');
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (parsed?.id) {
                setCurrentUser(parsed);
              }
            } catch {
              localStorage.removeItem('epicphone_auth_user');
            }
          }
        }

        // Ambil daftar user aktif untuk referensi sistem
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const uList = await usersRes.json();
          setUsers(uList);
        }
      } catch (err) {
        console.error('Failed to check auth:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe = true) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Username atau kata sandi salah' };
      }

      setCurrentUser(data.user);
      if (rememberMe) {
        localStorage.setItem('epicphone_auth_user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('epicphone_auth_user', JSON.stringify(data.user));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal terhubung ke server login' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('epicphone_auth_user');
      localStorage.removeItem('epicphone_user_id');
      sessionStorage.removeItem('epicphone_auth_user');
      router.push('/login');
    }
  };

  const switchUser = (userId: number) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('epicphone_auth_user', JSON.stringify(found));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.peran || 'karyawan',
        isAuthenticated: Boolean(currentUser),
        isLoading,
        login,
        logout,
        users,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
