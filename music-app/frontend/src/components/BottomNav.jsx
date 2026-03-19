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
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 90, 
        height: 70, 
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        background: 'rgba(0,0,0,0.9)', 
        borderTop: '1px solid rgba(255,255,255,0.05)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '0 5vw',
      }}
    >
      <div style={{ display: 'flex', gap: '10vw', alignItems: 'center', position: 'relative', zIndex: 1 }}>
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
                gap: 5, cursor: 'pointer', position: 'relative',
                padding: '10px 0',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ 
                fontSize: 20, 
                color: active ? '#ff2d78' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.4s ease'
              }}>
                {item.icon}
              </span>
              <span className="font-mono" style={{ 
                fontSize: 9, 
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                fontWeight: 900,
                letterSpacing: '0.2em',
                transition: 'all 0.4s ease'
              }}>
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="nav-active-bar"
                  style={{
                    position: 'absolute', top: 0, width: '100%', height: 2,
                    background: '#ff2d78', 
                    borderRadius: 0
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;
