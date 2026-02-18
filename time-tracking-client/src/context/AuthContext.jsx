import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'خطأ في تسجيل الدخول',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
    isManager: user?.role === 'manager',
    isOperator: user?.role === 'operator',
    canWrite: user?.role === 'admin' || user?.role === 'super_admin',
    canManageProjects: user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'operator',
    canRead: user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager',
    hasPermission: (feature) => {
      if (!user) return false;
      if (user.role === 'admin' || user.role === 'super_admin') return true;
      if (user.role === 'operator') return feature === 'time_tracking';
      return user.permissions?.[feature] === true;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
