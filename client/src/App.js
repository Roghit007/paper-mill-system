import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './theme.css';
import './responsive.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import ToastHost from './components/ToastHost';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Machines from './pages/Machines';
import Production from './pages/Production';
import Quality from './pages/Quality';
import Maintenance from './pages/Maintenance';
import Waste from './pages/Waste';
import Users from './pages/Users';
import Reports from './pages/Reports';

// Sidebar + page area (shown only after login)
function AppLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="app-content" style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  // restore the saved light / dark theme
  useEffect(() => {
    let saved = 'light';
    try { saved = localStorage.getItem('pm-theme') || 'light'; } catch (e) { /* ignore */ }
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ToastHost />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/production" element={<Production />} />
            <Route path="/quality" element={<Quality />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/waste" element={<Waste />} />
            <Route path="/reports" element={<Reports />} />
            <Route
              path="/users"
              element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;