import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GlobalCursor from './components/GlobalCursor';
import LoadingScreen from './components/LoadingScreen';
import BottomNav from './components/BottomNav';
import MiniPlayer from './components/MiniPlayer';
import IOSInstallPrompt from './components/IOSInstallPrompt';
import GlobalCanvas from './components/GlobalCanvas';
import SplineBackground from './components/SplineBackground';
import SmoothScroll from './components/SmoothScroll';
import usePlayer from './hooks/usePlayer';
import usePlayerStore from './store/playerStore';
import { getSupabaseConfigError, supabase } from './lib/supabase';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read the Supabase session that was previously saved to localStorage by the
 * Supabase JS client — without any network request. Returns the session object
 * or null if nothing is cached / the token looks invalid.
 *
 * This lets us show the app immediately when offline, as long as the user has
 * logged in at least once before.
 */
const readCachedSupabaseSession = () => {
  try {
    const key = Object.keys(localStorage).find(
      (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    if (!key) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Require the minimum Supabase session shape
    if (parsed?.access_token && parsed?.user) return parsed;
    return null;
  } catch {
    return null;
  }
};

// Lazy-loaded pages
const Home = React.lazy(() => import('./pages/Home'));
const Search = React.lazy(() => import('./pages/Search'));
const NowPlaying = React.lazy(() => import('./pages/NowPlaying'));
const Library = React.lazy(() => import('./pages/Library'));
const Profile = React.lazy(() => import('./pages/Profile'));

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.97 }}
    transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
    style={{ minHeight: '100dvh', willChange: 'opacity, transform' }}
  >
    {children}
  </motion.div>
);

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: '40px 20px',
          background: '#000',
          color: '#fff',
        }}>
          <div className="glass" style={{ width: 'min(420px, 90%)', padding: 32, textAlign: 'center' }}>
            <h2 style={{ marginBottom: 10, fontSize: 26 }}>SOMETHING WENT WRONG</h2>
            <p className="font-mono" style={{ marginBottom: 24, opacity: 0.7, fontSize: 10 }}>
              THE APP HIT AN UNEXPECTED ERROR. TAP TO RECOVER.
            </p>
            <button className="btn-premium" onClick={() => window.location.reload()}>
              RESTART APP
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ProtectedRoute = ({ session, authReady, children }) => {
  if (!authReady) return <PageSkeleton />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnlyRoute = ({ session, authReady, children }) => {
  if (!authReady) return <PageSkeleton />;
  if (session) return <Navigate to="/" replace />;
  return children;
};

const TopBar = ({ session }) => {
  const raw =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split('@')[0] ||
    '';
  const firstName = raw.split(/[\s._@+\d]+/).filter(Boolean)[0] || '';
  const display = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
    : 'You';

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      className="liquid-glass"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 80,
        borderTopLeftRadius: 0, borderTopRightRadius: 0,
        borderLeft: 'none', borderRight: 'none', borderTop: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 5vw',
      }}
    >
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h1 style={{
          fontSize: 24, margin: 0, color: '#fff',
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900,
          letterSpacing: '-0.02em'
        }}>
          RAABTA<span className="text-pink">.</span>
        </h1>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span className="font-mono" style={{ fontSize: 10, color: '#fff' }}>
          {display}
        </span>
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div className="flex-center" style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            fontSize: 14, fontWeight: 900, color: '#fff',
            fontFamily: "'Space Grotesk', sans-serif",
            overflow: 'hidden'
          }}>
            {display[0]?.toUpperCase() || '♪'}
          </div>
        </Link>
      </div>
    </motion.header>
  );
};

const AuthPage = ({ mode = 'login' }) => {
  const isRegister = mode === 'register';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      if (isRegister) {
        await supabase.auth.signUp({
          email, password,
          options: displayName.trim() ? { data: { full_name: displayName.trim() } } : undefined,
        });
      } else {
        await supabase.auth.signInWithPassword({ email, password });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', position: 'relative', zIndex: 10 }}>
      <form
        onSubmit={onSubmit}
        className="glass"
        style={{
          width: 'min(420px, 90%)',
          padding: 60,
          display: 'grid',
          gap: 30,
        }}
      >
        <div>
          <h2 style={{ fontSize: 48, marginBottom: 10 }}>{isRegister ? 'JOIN' : 'LOGIN'}</h2>
          <p className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
            {isRegister ? 'START YOUR JOURNEY' : 'WELCOME BACK COMMANDER'}
          </p>
        </div>

        {isRegister && (
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="NAME"
            style={{
              background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', padding: '10px 0', outline: 'none', fontFamily: "'Share Tech Mono', monospace"
            }}
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="EMAIL"
          style={{
            background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', padding: '10px 0', outline: 'none', fontFamily: "'Share Tech Mono', monospace"
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="PASSWORD"
          style={{
            background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', padding: '10px 0', outline: 'none', fontFamily: "'Share Tech Mono', monospace"
          }}
        />

        <button type="submit" className="btn-premium" disabled={loading}>
          {loading ? 'PROCESSING...' : isRegister ? 'CREATE ACCOUNT' : 'ENTER'}
        </button>

        <p style={{ fontSize: 12, textAlign: 'center' }}>
          {isRegister ? 'ALREADY REGISTERED?' : 'NEW USER?'}{' '}
          <Link to={isRegister ? '/login' : '/register'} style={{ color: '#ff2d78', textDecoration: 'none', fontWeight: 700 }}>
            {isRegister ? 'SIGN IN' : 'REGISTER'}
          </Link>
        </p>
      </form>
    </div>
  );
};

const AnimatedRoutes = ({ session, authReady }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PublicOnlyRoute session={session} authReady={authReady}><PageTransition><AuthPage mode="login" /></PageTransition></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute session={session} authReady={authReady}><PageTransition><AuthPage mode="register" /></PageTransition></PublicOnlyRoute>} />
        <Route path="/" element={<ProtectedRoute session={session} authReady={authReady}><PageTransition><Home /></PageTransition></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute session={session} authReady={authReady}><PageTransition><Search /></PageTransition></ProtectedRoute>} />
        <Route path="/now-playing" element={<ProtectedRoute session={session} authReady={authReady}><PageTransition><NowPlaying /></PageTransition></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute session={session} authReady={authReady}><PageTransition><Library /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute session={session} authReady={authReady}><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={session ? '/' : '/login'} replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppInner = () => {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  const hydrateFromSupabase = usePlayerStore((s) => s.hydrateFromSupabase);
  const setUserId = usePlayerStore((s) => s.setUserId);

  useEffect(() => {
    let mounted = true;

    // -----------------------------------------------------------------------
    // OFFLINE FAST-PATH
    // If the device is offline, immediately seed the session from localStorage
    // so the user can see their offline songs without waiting for the network.
    // -----------------------------------------------------------------------
    if (!navigator.onLine) {
      const cached = readCachedSupabaseSession();
      if (cached && mounted) {
        setSession(cached);
        setUserId(cached.user?.id || 'guest');
        setAuthReady(true);
      } else if (mounted) {
        // First-time user on offline device — go to login
        setSession(null);
        setAuthReady(true);
      }
    }

    const loadSession = async () => {
      if (!supabase) {
        if (mounted) { setSession(null); setAuthReady(true); }
        return;
      }
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { session: null }, timedOut: true }), 5000)
          ),
        ]);

        if (sessionResult?.timedOut) {
          // Timed out — fall back to cached session so the app still works
          console.warn('Session bootstrap timed out, using cached session if available.');
          const cached = readCachedSupabaseSession();
          if (mounted) {
            const s = cached || null;
            setSession(s);
            setUserId(s?.user?.id || 'guest');
          }
        } else {
          const { data } = sessionResult;
          const s = data?.session || null;
          if (mounted) {
            setSession(s);
            setUserId(s?.user?.id || 'guest');
          }
        }
      } catch (error) {
        console.warn('Session bootstrap failed, using cached session:', error?.message || error);
        const cached = readCachedSupabaseSession();
        if (mounted) {
          const s = cached || null;
          setSession(s);
          setUserId(s?.user?.id || 'guest');
        }
      } finally {
        if (mounted) {
          setAuthReady(true);
        }
      }
    };

    loadSession();

    const { data: authSub } = supabase
      ? supabase.auth.onAuthStateChange((_event, nextSession) => {
          const s = nextSession || null;
          setSession(s);
          setUserId(s?.user?.id || 'guest');
        })
      : { data: { subscription: { unsubscribe: () => {} } } };

    return () => { mounted = false; authSub.subscription.unsubscribe(); };
  }, [setUserId]);

  useEffect(() => {
    // Only hydrate from Supabase when the device has network access.
    // If offline, the store is already seeded from localStorage — don't wipe it.
    const tryHydrate = () => {
      if (navigator.onLine) {
        hydrateFromSupabase().catch(console.warn);
      }
    };
    tryHydrate();
    window.addEventListener('online', tryHydrate);
    return () => window.removeEventListener('online', tryHydrate);
  }, [hydrateFromSupabase]);

  usePlayer();



  const isPublicAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isHomePage = location.pathname === '/';
  const isProfilePage = location.pathname === '/profile';
  const showShell = authReady && session && !isPublicAuthPage;
  const isNowPlayingRoute = location.pathname === '/now-playing';

  const content = (
    <div style={{ position: 'relative', minHeight: '100dvh', background: '#000', overflow: 'hidden' }}>
      {!isProfilePage ? (
        <SplineBackground mode={isHomePage ? 'orange' : 'pink'} />
      ) : (
        isIOS ? <SplineBackground mode="pink" /> : <GlobalCanvas />
      )}
      <div className="noise" />

      {showShell && !isNowPlayingRoute && <TopBar session={session} />}

      <main style={{
        position: 'relative', zIndex: 2,
        paddingBottom: 150,
        background: 'transparent'
      }}>
        <Suspense fallback={<PageSkeleton />}>
          <AnimatedRoutes session={session} authReady={authReady} />
        </Suspense>
      </main>

      {showShell && <MiniPlayer />}
      {showShell && <BottomNav />}
      {showShell && <IOSInstallPrompt />}
      <GlobalCursor />
    </div>
  );

  return isNowPlayingRoute ? content : <SmoothScroll>{content}</SmoothScroll>;
};

export default function App() {
  const [appLoaded, setAppLoaded] = useState(false);
  return (
    <BrowserRouter>
      <LoadingScreen onComplete={() => setAppLoaded(true)} />
      {appLoaded && (
        <AppErrorBoundary>
          <AppInner />
        </AppErrorBoundary>
      )}
    </BrowserRouter>
  );
}

const PageSkeleton = () => (
  <div style={{ padding: '100px 20px' }}>
    <div className="shimmer" style={{ height: 60, width: '60%', marginBottom: 40, borderRadius: 12 }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 20 }}>
      {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="shimmer" style={{ height: 180, borderRadius: 24 }} />)}
    </div>
  </div>
);
