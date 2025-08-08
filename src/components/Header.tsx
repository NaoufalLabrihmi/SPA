import React, { useState } from 'react';
import { BellIcon, UserCircleIcon } from './icons';
import { NavLink, useLocation } from 'react-router-dom';
import EditProfileModal from './EditProfileModal';

const nav = [
  { name: 'Dashboard', path: '/' },
  { name: 'Employees', path: '/employees' },
  { name: 'ARBEITSVERTRAG FÜR', path: '/arbeitsvertrag' },
  { name: 'Firma', path: '/company' },
];

export default function Header() {
  const location = useLocation();
  const [dropdown, setDropdown] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const username = localStorage.getItem('username') || '';
  const role = localStorage.getItem('role') || '';
  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-4 md:py-5 animate-slide-in-down rounded-b-2xl border-b border-blue-100" style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)' }}>
      <div className="flex items-center gap-8 w-full md:w-auto">
        <div className="flex items-center gap-3">
          <span className="text-2xl md:text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow flex items-center gap-2">
            gestionEmpl
            <span className="block h-1 w-8 bg-gradient-to-r from-blue-400 via-blue-300 to-blue-200 rounded-full animate-pulse mt-1" />
          </span>
        </div>
        <nav className="flex gap-2 md:gap-4 ml-2">
          {nav.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-base ${isActive ? 'bg-gradient-to-r from-blue-500/90 to-blue-400/80 text-white shadow scale-105' : 'text-blue-900 hover:bg-blue-100 hover:scale-105'}`
              }
              aria-current={location.pathname === item.path ? 'page' : undefined}
            >
              {item.name}
            </NavLink>
          ))}
          {role === 'admin' && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-base ${isActive ? 'bg-gradient-to-r from-blue-500/90 to-blue-400/80 text-white shadow scale-105' : 'text-blue-900 hover:bg-blue-100 hover:scale-105'}`
              }
              aria-current={location.pathname === '/users' ? 'page' : undefined}
            >
              Users
            </NavLink>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-4 mt-4 md:mt-0">
        {/* User icon with dropdown */}
        <div className="relative">
          <button
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow ring-2 ring-blue-200 ml-2 focus:outline-none"
            onClick={() => setDropdown(d => !d)}
            aria-label="User menu"
          >
            <UserCircleIcon />
          </button>
          {dropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-50 border border-blue-100">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-900 font-medium"
                onClick={() => { setEditProfileOpen(true); setDropdown(false); }}
              >
                Edit Profile
              </button>
              <div className="px-4 py-2 text-blue-700 text-sm border-b border-blue-50">{username}</div>
              <div className="px-4 py-2 text-blue-500 text-xs font-bold">{role}</div>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-red-600 font-bold"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <EditProfileModal open={editProfileOpen} onClose={() => setEditProfileOpen(false)} />
    </header>
  );
} 