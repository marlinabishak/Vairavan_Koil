import { createContext, useContext, useState } from 'react';
import { api } from '../api/client.js';

// Roles: 'SUPER_ADMIN', 'ADMIN', 'ULTHURAI', 'USER'
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [error, setError] = useState(null);

  const login = async (username, password) => {
    try {
      setError(null);
      const data = await api.login(username, password);
      
      // Save to localStorage for persistence across reloads
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}
