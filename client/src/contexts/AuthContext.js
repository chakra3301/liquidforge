import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Automatically log in as demo user
  const [user] = useState({ email: 'demo@user.com', userId: 1 });
  const [loading] = useState(false);
  const [authToken] = useState('demo-token');

  // No-op login/logout
  const login = async () => {};
  const logout = () => {};

  return (
    <AuthContext.Provider value={{ user, token: authToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 