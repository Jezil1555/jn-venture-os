import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/companies', label: 'Companies' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-mark">
          JN Venture<span>OS</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="name">{user?.name}</div>
          <div className="role">{user?.role}</div>
          <button type="button" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="content">
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
