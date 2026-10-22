import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Cog, Factory, ClipboardCheck, Wrench, Recycle, Users, LogOut, Sun, Moon, Menu, Layers, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false); // phones / tablets only
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('pm-theme') || 'light'; } catch (e) { return 'light'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('pm-theme', theme); } catch (e) { /* ignore */ }
  }, [theme]);

  const items = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/machines', label: 'Machines', icon: Cog },
    { path: '/production', label: 'Production', icon: Factory },
    { path: '/quality', label: 'Quality', icon: ClipboardCheck },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench },
    { path: '/waste', label: 'Waste', icon: Recycle },
    { path: '/reports', label: 'Reports', icon: FileText }
  ];
  if (user && user.role === 'admin') items.push({ path: '/users', label: 'Users', icon: Users });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <button className="menu-btn" aria-label="Open menu" onClick={() => setOpen(!open)}><Menu size={20} /></button>
      {open && <div className="app-overlay" onClick={() => setOpen(false)} />}

      <aside className={`app-sidebar${open ? ' open' : ''}`}>
        <div className="brand">
          <div className="brand-logo"><Layers size={22} /></div>
          <div>
            <div className="brand-name">PaperMill</div>
            <div className="brand-sub">Management Suite</div>
          </div>
        </div>

        <div className="nav-label">Menu</div>
        <nav>
          {items.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={`nav-link${location.pathname === path ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {user && (
          <div className="user-card">
            <div className="user-row">
              <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role.toUpperCase()}</div>
              </div>
            </div>
            <div className="user-actions">
              <button className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Switch theme">
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'light' ? 'Dark' : 'Light'}
              </button>
              <button className="icon-btn logout" onClick={handleLogout}><LogOut size={16} /> Logout</button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;