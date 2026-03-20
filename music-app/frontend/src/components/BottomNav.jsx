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
      position: 'fixed',
      bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      width: '85%',
      maxWidth: '400px',
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(30px) saturate(200%)',
      WebkitBackdropFilter: 'blur(30px) saturate(200%)',
      borderRadius: '32px',
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,45,120,0.1)',
      overflow: 'hidden'
    }}>
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: 70,
          padding: '0 10px'
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(item.path)}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                position: 'relative',
                flex: 1,
                padding: '10px 0'
              }}
            >
              <span style={{ 
                fontSize: 24, 
                color: active ? '#ff2d78' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s ease',
                textShadow: active ? '0 0 10px rgba(255,45,120,0.5)' : 'none'
              }}>
                {item.icon}
              </span>
              <span style={{ 
                fontSize: 8, 
                color: active ? '#ff2d78' : 'rgba(255,255,255,0.4)',
                fontWeight: 900,
                fontFamily: "'Space Grotesk', sans-serif",
                transition: 'all 0.3s ease'
              }}>
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="active-dot"
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#ff2d78',
                    boxShadow: '0 0 8px #ff2d78'
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.nav>
    </div>
  );
};

export default BottomNav;
