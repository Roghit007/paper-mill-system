import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { TOKEN_KEY } from '../services/api';

// UI-only permissions (hide buttons). The real enforcement is on the server.
// write = can add/edit records, delete = can delete records
const PERMISSIONS = {
  machines:    { write: ['admin'],              delete: ['admin'] },
  production:  { write: ['admin', 'operator'],  delete: ['admin'] },
  maintenance: { write: ['admin', 'operator'],  delete: ['admin'] },
  quality:     { write: ['admin', 'inspector'], delete: ['admin'] },
  waste:       { write: ['admin', 'inspector'], delete: ['admin'] }
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load, restore the session if a token exists
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const can = (module, action) =>
    !!user && ((PERMISSIONS[module] && PERMISSIONS[module][action]) || []).includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
