import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'home', label: 'HOME', path: '/', icon: '⌂' },
  { id: 'search', label: 'SEARCH', path: '/search', icon: '⚲' },
  { id: 'library', label: 'LIBRARY', path: '/library', icon: '🕮' },
  { id: 'profile', label: 'PROFILE', path: '/profile', icon: '⚙' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70,
        height: 80,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(0,0,0,0.5)',
        borderTop: '1px solid rgba(255,45,120,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px',
      }}
    >
      <div style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                background: 'none', border: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 5, cursor: 'pointer', position: 'relative'
              }}
            >
              <span style={{ 
                fontSize: 20, 
                color: active ? '#ff2d78' : 'rgba(255,255,255,0.3)',
                transition: 'color 0.3s ease'
              }}>
                {item.icon}
              </span>
              <span className="font-mono" style={{ 
                fontSize: 8, 
                color: active ? '#fff' : 'rgba(255,255,255,0.3)',
                fontWeight: active ? 700 : 400,
                transition: 'color 0.3s ease'
              }}>
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="nav-active"
                  style={{
                    position: 'absolute', bottom: -15, width: 20, height: 2,
                    background: '#ff2d78', boxShadow: '0 0 10px #ff2d78'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;
