import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/faq', label: 'FAQ' },
  { to: '/complaints', label: 'Complaints' },
];

const Navbar = ({ isDarkMode, toggleTheme }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  const headerClass = isDarkMode
    ? 'border-b border-slate-800 bg-slate-900/90 text-slate-100'
    : 'border-b border-slate-200 bg-slate-50/90 text-slate-950';

  const buttonClass = isDarkMode
    ? 'rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300'
    : 'rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-700';

  useEffect(() => {
    const activeIndex = navLinks.findIndex((link) => link.to === location.pathname);
    const activeElement = navRefs.current[activeIndex];
    if (activeElement) {
      const rect = activeElement.getBoundingClientRect();
      const parentRect = activeElement.parentElement.getBoundingClientRect();
      setIndicatorStyle({ width: rect.width, left: rect.left - parentRect.left });
    }
  }, [location.pathname, isDarkMode]);

  return (
    <header className={`${headerClass} backdrop-blur`}> 
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-lg font-semibold text-emerald-400">
            CG
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-emerald-400">CIVIC GRIEVANCE</p>
            <p className={isDarkMode ? 'text-xs text-slate-400' : 'text-xs text-slate-600'}>Digital Public Service</p>
          </div>
        </Link>

        <nav className="relative hidden items-center gap-6 md:flex">
          <div className="absolute bottom-0 h-1 rounded-full bg-emerald-400 transition-all duration-300" style={{ width: indicatorStyle.width, left: indicatorStyle.left }} />
          {navLinks.map((link, index) => (
            <NavLink
              key={link.to}
              to={link.to}
              ref={(el) => (navRefs.current[index] = el)}
              className={({ isActive }) =>
                `relative z-10 text-sm font-medium transition ${isActive ? 'text-emerald-400' : isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleTheme} className={buttonClass}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          {isAuthenticated ? (
            <>
              <span className={isDarkMode ? 'hidden text-sm text-slate-400 md:block' : 'hidden text-sm text-slate-600 md:block'}>
                {user?.name || 'Citizen'}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-400"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
