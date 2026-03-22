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
      /* light frosted glass body */
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.45) 0%,
        rgba(255, 255, 255, 0.30) 50%,
        rgba(255, 255, 255, 0.40) 100%
      );
      backdrop-filter:          blur(30px) saturate(190%) brightness(1.1);
      -webkit-backdrop-filter:  blur(30px) saturate(190%) brightness(1.1);
      /* outer drop shadow */
      box-shadow:
        0 12px 52px rgba(0,0,0,0.15),
        0  4px 24px rgba(0, 0, 0, 0.08),
        inset 0  1px 0 rgba(255,255,255,0.60),
        inset 0 -1px 0 rgba(0, 0, 0, 0.05);
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
      opacity: 0.4;
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
        rgba(255,255,255,0.8) 30%,
        rgba(255,255,255,0.9) 50%,
        rgba(255,255,255,0.8) 70%,
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
    .bnav-btn:hover  { background: rgba(0,0,0,0.05); transform: translateY(-2px); }
    .bnav-btn:active { transform: scale(0.91); }
    .bnav-btn.bnav-active {
      background: rgba(0,0,0,0.03);
    }

    /* ── icon ── */
    .bnav-ico {
      font-size: 20px;
      line-height: 1;
      transition: color 0.28s, text-shadow 0.28s, transform 0.28s;
    }
    .bnav-btn:hover .bnav-ico { transform: scale(1.14); }
    .bnav-ico-on {
      color: #000000;
      text-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .bnav-ico-off {
      color: rgba(0, 0, 0, 0.4);
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
    .bnav-lbl-on  { color: #000000; }
    .bnav-lbl-off { color: rgba(0, 0, 0, 0.35); }

    /* ── active pip dot ── */
    .bnav-pip {
      width: 3px; height: 3px;
      border-radius: 50%;
      background: #000000;
      box-shadow: 0 0 6px rgba(0,0,0,0.2);
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
