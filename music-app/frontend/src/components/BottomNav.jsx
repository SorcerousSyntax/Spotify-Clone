import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import useColorExtract from '../hooks/useColorExtract';

const HomeIcon = ({ filled }) => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    {filled ? (
      <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    ) : (
      <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    )}
  </svg>
);

const SearchIcon = ({ filled }) => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeWidth={filled ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const MusicIcon = ({ filled }) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    {filled ? (
      <path fill="currentColor" d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" />
    ) : (
      <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM9 10l12-3" />
    )}
  </svg>
);

const ProfileIcon = ({ filled }) => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    {filled ? (
      <path fill="currentColor" d="M12 2a5 5 0 100 10 5 5 0 000-10zM12 14c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
    ) : (
      <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    )}
  </svg>
);

const tabs = [
  { id: 'home',    label: 'Home',    path: '/',        Icon: HomeIcon },
  { id: 'search',  label: 'Search',  path: '/search',  Icon: SearchIcon },
  { id: 'library', label: 'Library', path: '/library', Icon: MusicIcon },
  { id: 'profile', label: 'Profile', path: '/profile', Icon: ProfileIcon },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const currentSong = usePlayerStore((s) => s.currentSong);
  const { dominantColor } = useColorExtract(currentSong?.album_art_url);
  const [dr, dg, db] = dominantColor;
  // Blend album color 65% with violet 35% so the pill always looks musical
  const mixR = Math.round(dr * 0.65 + 139 * 0.35);
  const mixG = Math.round(dg * 0.65 + 92 * 0.35);
  const mixB = Math.round(db * 0.65 + 246 * 0.35);
  const pillColor = `rgb(${mixR},${mixG},${mixB})`;
  const pillColorDark = `rgb(${Math.round(mixR*0.7)},${Math.round(mixG*0.7)},${Math.round(mixB*0.7)})`;
  const pillGlow = `rgba(${mixR},${mixG},${mixB},0.6)`;

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Glass floating pill bar */}
      <div style={{
        margin: '0 12px 10px',
        borderRadius: 26,
        background: 'rgba(18,4,40,0.55)',
        backdropFilter: 'blur(48px) saturate(180%)',
        WebkitBackdropFilter: 'blur(48px) saturate(180%)',
        border: '1px solid rgba(167,139,250,0.28)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(139,92,246,0.08)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          height: 64, maxWidth: 480, margin: '0 auto', padding: '0 6px',
        }}>
          {tabs.map((tab, idx) => {
            const isActive = currentPath === tab.path;
            const isLibrary = tab.id === 'library';
            return (
              <motion.button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                whileTap={{ scale: 0.8 }}
                style={{
                  flex: 1, height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', outline: 'none',
                  gap: 3, cursor: 'pointer', position: 'relative', padding: 0,
                }}
              >
                {/* Active background pill */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="navActivePill"
                      initial={{ opacity: 0, scale: 0.65 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.65 }}
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                      style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: isLibrary ? 54 : 46,
                        height: isLibrary ? 54 : 46,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${pillColor}, ${pillColorDark})`,
                        boxShadow: `0 4px 22px ${pillGlow}`,
                        zIndex: 0,
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon */}
                <motion.div
                  animate={isActive ? { y: 0, scale: 1.08 } : { y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  style={{
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.32)',
                    position: 'relative', zIndex: 1,
                    lineHeight: 0,
                  }}
                >
                  <tab.Icon filled={isActive} />
                </motion.div>

                {/* Label — hidden when active (icon speaks for itself) */}
                {!isActive && (
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 9.5, fontWeight: 500,
                    letterSpacing: '0.03em',
                    color: 'rgba(255,255,255,0.25)',
                    lineHeight: 1, position: 'relative', zIndex: 1,
                  }}>
                    {tab.label}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
