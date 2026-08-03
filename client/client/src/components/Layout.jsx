import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, Building2, UserCircle, Users, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import './Layout.css';

const BASE_NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', end: true, icon: Home },
  { to: '/dashboard/overview', label: 'Overview', icon: LayoutGrid },
  { to: '/dashboard/companies', label: 'Companies', icon: Building2 },
  { to: '/dashboard/account', label: 'Account', icon: UserCircle },
];

const ADMIN_NAV_ITEMS = [
  { to: '/dashboard/users', label: 'Users', icon: Users },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = user?.role === 'admin' ? [...BASE_NAV_ITEMS, ...ADMIN_NAV_ITEMS] : BASE_NAV_ITEMS;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-mark">
          <img src="/evercrest-mark.png" alt="" className="sidebar-mark-icon" />
          <span>
            EVER<span className="accent">CREST</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
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
