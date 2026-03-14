import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{
        margin: '0 12px 10px',
        borderRadius: 26,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 -4px 32px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.22)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          height: 64, maxWidth: 480, margin: '0 auto', padding: '0 6px',
        }}>
          {tabs.map((tab) => {
            const isActive = currentPath === tab.path;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                style={{
                  flex: 1, height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', outline: 'none',
                  gap: 6, cursor: 'pointer', padding: 0,
                }}
              >
                <div style={{
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.32)',
                  lineHeight: 0,
                }}>
                  <tab.Icon filled={isActive} />
                </div>
                {/* Active dot indicator */}
                <div style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: isActive ? '#a78bfa' : 'transparent',
                  transition: 'background 0.25s ease',
                }} />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
