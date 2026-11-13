'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  users: User[];
  switchUser: (userId: number) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  role: 'pemilik',
  users: [],
  switchUser: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data: User[] = await res.json();
          setUsers(data);

          // Restore saved user or default to pemilik
          const savedUserId = localStorage.getItem('epicphone_user_id');
          const found = data.find((u) => String(u.id) === savedUserId) || data.find((u) => u.peran === 'pemilik') || data[0];
          if (found) {
            setCurrentUser(found);
          }
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const switchUser = (userId: number) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('epicphone_user_id', String(found.id));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.peran || 'pemilik',
        users,
        switchUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
