import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('token');
    console.log('AuthContext - Initial token check:', token ? 'Present' : 'Missing');
    if (token) {
      // Set user with token
      setUser({ token });
      console.log('AuthContext - User set from localStorage');
    } else {
      setUser(null);
      console.log('AuthContext - No token found, user set to null');
    }
  }, []);

  const login = (token, userData = null) => {
    console.log('AuthContext - Login called with token:', token ? 'Present' : 'Missing');
    localStorage.setItem('token', token);
    const userInfo = userData ? { ...userData, token } : { token };
    setUser(userInfo);
    console.log('AuthContext - User state updated:', userInfo);
  };

  const logout = () => {
    console.log('AuthContext - Logout called');
    localStorage.removeItem('token');
    setUser(null);
    console.log('AuthContext - User state cleared');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 