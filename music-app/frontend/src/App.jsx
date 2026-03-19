import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GlobalCursor from './components/GlobalCursor';
import LoadingScreen from './components/LoadingScreen';
import BottomNav from './components/BottomNav';
import MiniPlayer from './components/MiniPlayer';
import GlobalCanvas from './components/GlobalCanvas';
import SmoothScroll from './components/SmoothScroll';
import usePlayer from './hooks/usePlayer';
import usePlayerStore from './store/playerStore';
import { getSupabaseConfigError, supabase } from './lib/supabase';

// Lazy-loaded pages
const Home = React.lazy(() => import('./pages/Home'));
const Search = React.lazy(() => import('./pages/Search'));
const NowPlaying = React.lazy(() => import('./pages/NowPlaying'));
const Library = React.lazy(() => import('./pages/Library'));

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
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
        height: 80,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,45,120,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
      }}
    >
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h1 style={{
          fontSize: 32, margin: 0, color: '#fff',
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900
        }}>
          RAABTA<span style={{ color: '#ff2d78' }}>.</span>
        </h1>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span className="font-mono" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          {display}
        </span>
        <Link to="/profile">
          <div style={{
            width: 40, height: 40, borderRadius: 2,
            background: '#ff2d78',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#000',
            fontFamily: "'Space Grotesk', sans-serif"
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

        <button type="submit" className="btn-primary" disabled={loading}>
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
        <Route path="/profile" element={<ProtectedRoute session={session} authReady={authReady}><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />
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

  return (
    <SmoothScroll>
      <div style={{ position: 'relative', minHeight: '100dvh', background: 'transparent', overflow: 'hidden' }}>
        <GlobalCanvas />
        <div className="noise" />

        {showShell && !isNowPlayingRoute && <TopBar session={session} />}

        <main style={{
          position: 'relative', zIndex: 2,
          paddingTop: showShell && !isNowPlayingRoute ? 80 : 0,
          paddingBottom: showShell ? 150 : 0,
          background: 'transparent'
        }}>
          <Suspense fallback={<PageSkeleton />}>
            <AnimatedRoutes session={session} authReady={authReady} />
          </Suspense>
        </main>

        {showShell && !isNowPlayingRoute && <MiniPlayer />}
        {showShell && <BottomNav />}
        <GlobalCursor />
      </div>
    </SmoothScroll>
  );
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

const ProfilePage = () => {
  const likedCount = usePlayerStore((s) => s.likedSongIds.size);
  const playedCount = usePlayerStore((s) => s.recentlyPlayed.length);
  const onSignOut = () => supabase?.auth.signOut();

  return (
    <div style={{ padding: '100px 40px', maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ fontSize: 64, marginBottom: 40 }}>PROFILE</h2>
      <div className="glass" style={{ padding: 40, display: 'grid', gap: 20 }}>
        <div style={{ display: 'flex', gap: 40 }}>
          <div>
            <p className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>LIKED</p>
            <p style={{ fontSize: 32, fontWeight: 900 }}>{likedCount}</p>
          </div>
          <div>
            <p className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>PLAYED</p>
            <p style={{ fontSize: 32, fontWeight: 900 }}>{playedCount}</p>
          </div>
        </div>
        <button onClick={onSignOut} className="btn-secondary" style={{ width: 'fit-content' }}>SIGN OUT</button>
      </div>
    </div>
  );
};

const PageSkeleton = () => (
  <div style={{ padding: '100px 40px' }}>
    <div className="shimmer" style={{ height: 60, width: '40%', marginBottom: 40, borderRadius: 4 }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
      {[1, 2, 3, 4].map(i => <div key={i} className="shimmer" style={{ height: 280, borderRadius: 4 }} />)}
    </div>
  </div>
);
