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
        bottom: 0, // Absolute bottom
        left: 0, 
        right: 0, 
        zIndex: 90, // Above everything
        height: 70, // Slightly more compact
        backdropFilter: 'blur(30px) saturate(180%)', // Enhanced glassmorphism
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        background: 'rgba(0,0,0,0.75)', // Darker for contrast
        borderTop: '1px solid rgba(255,45,120,0.25)', // Brighter accent border
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '0 20px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' // Soft shadow above
      }}
    >
      {/* Dynamic Glow Graphics */}
      <div style={{
        position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
        width: '60%', height: '1px', 
        background: 'linear-gradient(90deg, transparent, rgba(255,45,120,0.8), transparent)',
        boxShadow: '0 0 15px rgba(255,45,120,0.4)'
      }} />

      <div style={{ display: 'flex', gap: 50, alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              style={{
                background: 'none', border: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, cursor: 'pointer', position: 'relative',
                padding: '8px 12px',
                borderRadius: '12px',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
              }}
            >
              <span style={{ 
                fontSize: 22, 
                color: active ? '#ff2d78' : 'rgba(255,255,255,0.4)',
                textShadow: active ? '0 0 12px rgba(255,45,120,0.6)' : 'none',
                transition: 'all 0.4s ease'
              }}>
                {item.icon}
              </span>
              <span className="font-mono" style={{ 
                fontSize: 9, 
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                fontWeight: active ? 700 : 400,
                letterSpacing: '0.15em',
                transition: 'all 0.4s ease'
              }}>
                {item.label}
              </span>
              {active && (
                <>
                  <motion.div
                    layoutId="nav-active-glow"
                    style={{
                      position: 'absolute', inset: 0, borderRadius: '12px',
                      background: 'rgba(255,45,120,0.1)',
                      zIndex: -1
                    }}
                  />
                  <motion.div
                    layoutId="nav-active-bar"
                    style={{
                      position: 'absolute', bottom: 0, width: 24, height: 2,
                      background: '#ff2d78', 
                      borderRadius: '2px',
                      boxShadow: '0 0 10px #ff2d78'
                    }}
                  />
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;
