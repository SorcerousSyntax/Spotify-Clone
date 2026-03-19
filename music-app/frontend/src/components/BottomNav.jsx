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
    <div style={{
      position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100, width: 'min(360px, 90vw)'
    }}>
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="nav-pill"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              style={{
                background: 'none', border: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 5, cursor: 'pointer', position: 'relative'
              }}
            >
              <span style={{ 
                fontSize: 22, 
                color: active ? '#ff2d78' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s ease'
              }}>
                {item.icon}
              </span>
              <span style={{ 
                fontSize: 9, 
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                fontWeight: 700,
                transition: 'all 0.3s ease'
              }}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </motion.nav>
    </div>
  );
};
  );
};

export default BottomNav;
