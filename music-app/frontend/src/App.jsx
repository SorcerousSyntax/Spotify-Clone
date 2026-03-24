import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GlobalCursor from './components/GlobalCursor';
import LoadingScreen from './components/LoadingScreen';
import BottomNav from './components/BottomNav';
import MiniPlayer from './components/MiniPlayer';
import IOSInstallPrompt from './components/IOSInstallPrompt';
import Background from './components/Background';
import SmoothScroll from './components/SmoothScroll';
import usePlayer from './hooks/usePlayer';
import usePlayerStore from './store/playerStore';
import { getSupabaseConfigError, supabase } from './lib/supabase';

// Lazy-loaded pages
const Home = React.lazy(() => import('./pages/Home'));
const Search = React.lazy(() => import('./pages/Search'));
const NowPlaying = React.lazy(() => import('./pages/NowPlaying'));
const Library = React.lazy(() => import('./pages/Library'));
const Profile = React.lazy(() => import('./pages/Profile'));

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.98 }}
    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
    style={{ minHeight: '100dvh', willChange: 'opacity, transform' }}
  >
    {children}
  </motion.div>
);

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
      transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      className="glass"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 70,
        borderTopLeftRadius: 0, borderTopRightRadius: 0,
        borderLeft: 'none', borderRight: 'none', borderTop: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 5vw',
      }}
    >
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h1 style={{
          fontSize: 22, margin: 0, color: '#fff',
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
          letterSpacing: '-0.03em'
        }}>
          RAABTA<span style={{ color: 'var(--color-accent-primary)' }}>.</span>
        </h1>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>
          {display.toUpperCase()}
        </span>
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div className="flex-center" style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            fontSize: 14, fontWeight: 700, color: '#fff',
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
          borderRadius: 32
        }}
      >
        <div>
          <h2 className="page-title">{isRegister ? 'JOIN' : 'LOGIN'}<span>.</span></h2>
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.1em' }}>
            {isRegister ? 'START YOUR JOURNEY' : 'WELCOME BACK'}
          </p>
        </div>

        {isRegister && (
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="NAME"
            style={{
              background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)',
              color: '#fff', padding: '10px 0', outline: 'none', fontFamily: "'Inter', sans-serif", fontWeight: 500
            }}
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="EMAIL"
          style={{
            background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)',
            color: '#fff', padding: '10px 0', outline: 'none', fontFamily: "'Inter', sans-serif", fontWeight: 500
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="PASSWORD"
          style={{
            background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)',
            color: '#fff', padding: '10px 0', outline: 'none', fontFamily: "'Inter', sans-serif", fontWeight: 500
          }}
        />

        <button type="submit" className="card-pressable" style={{
          background: 'var(--color-accent-primary)',
          color: '#fff',
          border: 'none',
          padding: '16px',
          borderRadius: 100,
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          boxShadow: '0 0 32px var(--color-accent-glow)'
        }} disabled={loading}>
          {loading ? 'PROCESSING...' : isRegister ? 'CREATE ACCOUNT' : 'ENTER'}
        </button>

        <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          {isRegister ? 'ALREADY REGISTERED?' : 'NEW USER?'}{' '}
          <Link to={isRegister ? '/login' : '/register'} style={{ color: 'var(--color-accent-primary)', textDecoration: 'none', fontWeight: 700 }}>
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
  const hydrateFromSupabase = usePlayerStore((s) => s.hydrateFromSupabase);

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      if (!supabase) {
        if (mounted) { setSession(null); setAuthReady(true); }
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (mounted) { setSession(data?.session || null); setAuthReady(true); }
    };
    loadSession();
    const { data: authSub } = supabase ? supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession || null); }) : { data: { subscription: { unsubscribe: () => {} } } };
    return () => { mounted = false; authSub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    hydrateFromSupabase().catch(console.error);
  }, [hydrateFromSupabase]);

  usePlayer();

  const isPublicAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const showShell = authReady && session && !isPublicAuthPage;
  const isNowPlayingRoute = location.pathname === '/now-playing';

  const content = (
    <div style={{ position: 'relative', minHeight: '100dvh', background: 'var(--color-bg-primary)', overflow: 'hidden' }}>
      <Background />
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
      {appLoaded && <AppInner />}
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
