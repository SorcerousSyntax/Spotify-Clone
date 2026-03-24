import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { id: 'home',     label: 'HOME',    path: '/',            icon: '⌂' },
  { id: 'search',   label: 'SEARCH',  path: '/search',      icon: '⌕' },
  { id: 'playing',  label: 'PLAYING', path: '/now-playing', icon: '♪' },
  { id: 'library',  label: 'LIBRARY', path: '/library',     icon: '▤' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path;
  };

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        position: 'fixed',
        bottom: 20,
        left: 12,
        right: 12,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <div
        className="glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          width: 'min(500px, 100%)',
          height: 72,
          borderRadius: 24,
          padding: '0 12px',
          background: 'rgba(10,10,10,0.85)',
          borderTop: '1px solid var(--color-border)',
          boxShadow: '0 -1px 0 var(--color-border)',
          pointerEvents: 'auto'
        }}
      >
        {ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="card-tap"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                outline: 'none',
                position: 'relative',
                height: '100%'
              }}
            >
              <span style={{
                fontSize: 22,
                color: active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                transition: 'color 160ms var(--ease-main)',
                lineHeight: 1
              }}>
                {item.icon}
              </span>
              
              <span style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                transition: 'color 160ms var(--ease-main)'
              }}>
                {item.label}
              </span>

              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--color-accent-primary)',
                    boxShadow: '0 0 10px var(--color-accent-primary)'
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
