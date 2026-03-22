import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── inject keyframes + styles once ─── */
const STYLE_ID = 'raabta-bnav-v3';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @property --bnav-angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }
    @keyframes bnav-spin {
      to { --bnav-angle: 360deg; }
    }

    /* ── pill wrapper ── */
    .bnav-pill {
      position: fixed;
      bottom: calc(20px + env(safe-area-inset-bottom, 0px));
      left: 4%;
      right: 4%;
      margin: 0 auto;
      max-width: 440px;
      width: auto;
      z-index: 9999;
      height: 70px;
      border-radius: 999px;
      /* darker frosted glass body for better contrast */
      background: linear-gradient(
        135deg,
        rgba(30, 20, 50, 0.95) 0%,
        rgba(20, 10, 40, 0.90) 50%,
        rgba(10, 5, 30, 0.95) 100%
      );
      backdrop-filter:          blur(40px) saturate(190%) brightness(0.8);
      -webkit-backdrop-filter:  blur(40px) saturate(190%) brightness(0.8);
      /* outer drop shadow */
      box-shadow:
        0 12px 52px rgba(0,0,0,0.80),
        0  4px 24px rgba(130, 70, 255, 0.4),
        inset 0  1px 0 rgba(255,255,255,0.15),
        inset 0 -1px 0 rgba( 90, 50, 190, 0.3);
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 0 10px;
      isolation: isolate;
    }

    /* animated iridescent border */
    .bnav-pill::before {
      content: '';
      position: absolute;
      inset: -1.5px;
      border-radius: 999px;
      background: conic-gradient(
        from var(--bnav-angle),
        #4a6cf7,
        #9b5cf6,
        #ea6af6,
        #f97316,
        #fbbf24,
        #f97316,
        #ea6af6,
        #9b5cf6,
        #4a6cf7
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box,
                    linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      padding: 1.5px;
      animation: bnav-spin 4s linear infinite;
      opacity: 0.85;
      z-index: -1;
    }

    /* top inner specular highlight */
    .bnav-pill::after {
      content: '';
      position: absolute;
      top: 0; left: 14%; right: 14%;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,0.55) 30%,
        rgba(210,175,255,0.72) 50%,
        rgba(255,255,255,0.55) 70%,
        transparent
      );
      pointer-events: none;
    }

    /* ── each button ── */
    .bnav-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 8px 4px 5px;
      border-radius: 26px;
      border: none;
      background: transparent;
      cursor: pointer;
      position: relative;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      transition:
        background 0.28s ease,
        transform  0.22s cubic-bezier(.34,1.56,.64,1);
    }
    .bnav-btn:hover  { background: rgba(180,140,255,0.10); transform: translateY(-2px); }
    .bnav-btn:active { transform: scale(0.91); }
    .bnav-btn.bnav-active {
      background: linear-gradient(135deg, rgba(160,100,255,0.20), rgba(80,100,255,0.13));
      box-shadow: inset 0 0 14px rgba(155,92,246,0.18), 0 0 16px rgba(130,80,255,0.12);
    }

    /* ── icon ── */
    .bnav-ico {
      font-size: 20px;
      line-height: 1;
      transition: color 0.28s, text-shadow 0.28s, transform 0.28s;
    }
    .bnav-btn:hover .bnav-ico { transform: scale(1.14); }
    .bnav-ico-on {
      color: #ffffff;
      text-shadow:
        0 0  9px rgba(200,150,255,0.95),
        0 0 22px rgba(140, 80,255,0.80),
        0 0 40px rgba(100,120,255,0.45);
    }
    .bnav-ico-off {
      color: rgba(255, 255, 255, 0.55);
    }

    /* ── label ── */
    .bnav-lbl {
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-family: 'Space Grotesk', system-ui, sans-serif;
      transition: color 0.28s, text-shadow 0.28s;
    }
    .bnav-lbl-on  { color: rgba(255,255,255,1); text-shadow: 0 0 8px rgba(175,115,255,0.7); }
    .bnav-lbl-off { color: rgba(255, 255, 255, 0.45); }

    /* ── active pip dot ── */
    .bnav-pip {
      width: 3px; height: 3px;
      border-radius: 50%;
      background: #c4a0ff;
      box-shadow: 0 0 6px #9b5cf6, 0 0 14px rgba(155,92,246,0.55);
    }
  `;
  document.head.appendChild(s);
}

/* ── nav items ── */
const ITEMS = [
  { id: 'home',     label: 'Home',    path: '/',            icon: '⌂' },
  { id: 'playing',  label: 'Playing', path: '/now-playing', icon: '♪' },
  { id: 'library',  label: 'Library', path: '/library',     icon: '▤' },
  { id: 'search',   label: 'Search',  path: '/search',      icon: '⌕' },
];

/* ── component ── */
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOn = (p) => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p));

  return (
    <motion.div
      className="bnav-pill"
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
    >
      {ITEMS.map((item) => {
        const on = isOn(item.path);
        return (
          <button
            key={item.id}
            className={`bnav-btn${on ? ' bnav-active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <span className={`bnav-ico ${on ? 'bnav-ico-on' : 'bnav-ico-off'}`}>
              {item.icon}
            </span>
            <span className={`bnav-lbl ${on ? 'bnav-lbl-on' : 'bnav-lbl-off'}`}>
              {item.label}
            </span>
            <AnimatePresence>
              {on && (
                <motion.div
                  key="pip"
                  layoutId="bnav-pip"
                  className="bnav-pip"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{   scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                />
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </motion.div>
  );
};

export default BottomNav;
