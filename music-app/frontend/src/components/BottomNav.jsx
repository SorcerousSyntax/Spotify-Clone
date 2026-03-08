import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  {
    id: 'home', label: 'Home', path: '/',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    iconFilled: (
      <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3l9 8v10a1 1 0 01-1 1h-5a1 1 0 01-1-1v-5h-4v5a1 1 0 01-1 1H4a1 1 0 01-1-1V11l9-8z" />
      </svg>
    ),
  },
  {
    id: 'search', label: 'Search', path: '/search',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    iconFilled: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'library', label: 'Library', path: '/library',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    iconFilled: (
      <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 11H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2zM19 9V7a2 2 0 00-2-2H7a2 2 0 00-2 2v2h14z" />
      </svg>
    ),
  },
  {
    id: 'profile', label: 'Profile', path: '/profile',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    iconFilled: (
      <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2a5 5 0 100 10 5 5 0 000-10zM12 14c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
      </svg>
    ),
  },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 4,
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'none',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 62, maxWidth: 480, margin: '0 auto', padding: '0 8px' }}>
        {tabs.map((tab) => {
          const isActive = currentPath === tab.path;
          return (
            <motion.button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.85 }}
              style={{
                flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', position: 'relative',
                background: isActive ? 'rgba(0,255,65,0.08)' : 'rgba(255,255,255,0.02)',
                border: isActive ? '1px solid rgba(0,255,65,0.28)' : '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 10,
                outline: 'none',
                gap: 4,
                cursor: 'pointer',
                margin: '8px 4px 6px',
                transition: 'all 0.18s ease',
              }}
            >
              {/* Active dot at bottom */}
              {isActive && (
                <motion.div
                  layoutId="navDot"
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#00ff41',
                    boxShadow: '0 0 6px #00ff41',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Icon — jump animation on active */}
              <motion.div
                animate={isActive ? { y: -2 } : { y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{
                  color: isActive ? '#00ff41' : 'rgba(255,255,255,0.3)',
                  filter: 'none',
                  transition: 'color 0.15s ease',
                }}
              >
                {isActive ? tab.iconFilled : tab.icon}
              </motion.div>

              <span style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isActive ? '#00ff41' : 'rgba(255,255,255,0.25)',
                fontWeight: 700,
                transition: 'color 0.15s ease',
              }}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
