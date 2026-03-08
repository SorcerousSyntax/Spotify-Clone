import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SmokeBackground from './components/SmokeBackground';
import FloatingParticles from './components/FloatingParticles';
import GlobalCursor from './components/GlobalCursor';
import LoadingScreen from './components/LoadingScreen';
import BottomNav from './components/BottomNav';
import MiniPlayer from './components/MiniPlayer';
import usePlayer from './hooks/usePlayer';
import usePlayerStore from './store/playerStore';
import { supabase } from './lib/supabase';

// Lazy-loaded pages
const Home = React.lazy(() => import('./pages/Home'));
const Search = React.lazy(() => import('./pages/Search'));
const NowPlaying = React.lazy(() => import('./pages/NowPlaying'));
const Library = React.lazy(() => import('./pages/Library'));

// Page transition wrapper (scale + fade, stage-like)
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1.03 }}
    exit={{ opacity: 0, scale: 0.97 }}
    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    style={{ minHeight: '100dvh' }}
  >
    {children}
  </motion.div>
);

const ProtectedRoute = ({ session, authReady, children }) => {
  if (!authReady) {
    return <PageSkeleton />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ session, authReady, children }) => {
  if (!authReady) {
    return <PageSkeleton />;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AuthPage = ({ mode = 'login' }) => {
  const isRegister = mode === 'register';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setMessage('Account created. Check email if confirmation is enabled.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
        } else {
          setMessage('Logged in successfully.');
        }
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', position: 'relative', zIndex: 10, padding: 18 }}>
      <form
        onSubmit={onSubmit}
        style={{
          width: 'min(380px, 100%)',
          padding: 18,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          display: 'grid',
          gap: 10,
        }}
      >
        <h1 style={{ margin: 0, fontFamily: "'Bebas Neue', cursive", fontSize: 38, color: '#fff', letterSpacing: '0.05em' }}>
          {isRegister ? 'Register' : 'Login'}
        </h1>
        <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
          {isRegister ? 'Create a new account to continue.' : 'Sign in to access Raabta.'}
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{
            width: '100%', padding: '11px 12px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)',
            color: '#fff', outline: 'none', fontFamily: "'DM Mono', monospace", fontSize: 12,
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            width: '100%', padding: '11px 12px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)',
            color: '#fff', outline: 'none', fontFamily: "'DM Mono', monospace", fontSize: 12,
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            borderRadius: 10,
            border: '1px solid rgba(0,255,106,0.35)',
            background: 'rgba(0,255,106,0.12)',
            color: '#00ff6a',
            padding: '10px 12px',
            cursor: loading ? 'default' : 'pointer',
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
        </button>

        <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
          {isRegister ? 'Already have an account?' : 'No account yet?'}{' '}
          <Link to={isRegister ? '/login' : '/register'} style={{ color: '#9dffbf' }}>
            {isRegister ? 'Login' : 'Register'}
          </Link>
        </p>

        {error && <p style={{ margin: 0, color: '#ff7d7d', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{error}</p>}
        {message && <p style={{ margin: 0, color: '#9dffbf', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{message}</p>}
      </form>
    </div>
  );
};

const AnimatedRoutes = ({ session, authReady }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={(
            <PublicOnlyRoute session={session} authReady={authReady}>
              <PageTransition><AuthPage mode="login" /></PageTransition>
            </PublicOnlyRoute>
          )}
        />
        <Route
          path="/register"
          element={(
            <PublicOnlyRoute session={session} authReady={authReady}>
              <PageTransition><AuthPage mode="register" /></PageTransition>
            </PublicOnlyRoute>
          )}
        />

        <Route
          path="/"
          element={(
            <ProtectedRoute session={session} authReady={authReady}>
              <PageTransition><Home /></PageTransition>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/search"
          element={(
            <ProtectedRoute session={session} authReady={authReady}>
              <PageTransition><Search /></PageTransition>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/now-playing"
          element={(
            <ProtectedRoute session={session} authReady={authReady}>
              <PageTransition><NowPlaying /></PageTransition>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/library"
          element={(
            <ProtectedRoute session={session} authReady={authReady}>
              <PageTransition><Library /></PageTransition>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute session={session} authReady={authReady}>
              <PageTransition><ProfilePage /></PageTransition>
            </ProtectedRoute>
          )}
        />

        <Route path="*" element={<Navigate to={session ? '/' : '/login'} replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppInner = () => {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const computeDesktopMode = () => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia) {
      return window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches;
    }
    return window.innerWidth >= 1024;
  };

  const [isDesktop, setIsDesktop] = useState(
    computeDesktopMode()
  );

  const hydrateFromSupabase = usePlayerStore((s) => s.hydrateFromSupabase);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      if (!supabase) {
        if (mounted) {
          setSession(null);
          setAuthReady(true);
        }
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Supabase getSession error:', error);
      }

      if (mounted) {
        setSession(data?.session || null);
        setAuthReady(true);
      }
    };

    loadSession();

    const { data: authSub } = supabase
      ? supabase.auth.onAuthStateChange((_event, nextSession) => {
          setSession(nextSession || null);
        })
      : { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onResize = () => setIsDesktop(computeDesktopMode());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    console.log('Supabase:', supabase);
    hydrateFromSupabase().catch((error) => {
      console.error('Supabase hydration error:', error);
    });
  }, [hydrateFromSupabase]);

  usePlayer();

  const isPublicAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const showShell = authReady && session && !isPublicAuthPage;
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const isNowPlayingRoute = normalizedPath === '/now-playing';
  const showMiniPlayer = showShell && !isNowPlayingRoute;

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', background: '#000000' }}>
      {/* z-0: Three.js smoke */}
      <SmokeBackground />

      {/* z-1: Scanlines + noise */}
      <div className="scanlines" />
      <FloatingParticles count={25} />
      <div className="noise-overlay" />

      {/* z-2: Page content */}
      <main
        style={{
          position: 'relative',
          zIndex: 2,
          // Extra mobile spacing keeps list rows visible above MiniPlayer + BottomNav.
          paddingBottom: showShell ? (isDesktop ? '24px' : (isNowPlayingRoute ? '96px' : '170px')) : '24px',
          paddingRight: showShell ? (isDesktop ? '360px' : '0px') : '0px',
          transition: 'padding-right 0.25s ease',
        }}
      >
        <Suspense fallback={<PageSkeleton />}>
          <AnimatedRoutes session={session} authReady={authReady} />
        </Suspense>
      </main>

      {/* z-3: Mini player, z-4: Bottom nav */}
      {showMiniPlayer && <MiniPlayer />}
      {showShell && <BottomNav />}

      {/* z-99: Custom cursor */}
      <GlobalCursor />
    </div>
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (userError) {
        console.error('Supabase getUser error:', userError);
        return;
      }
      setUser(data?.user || null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!supabase) {
      setError('Supabase is not configured');
      return;
    }

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    try {
      setLoading(true);
      if (isSignup) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setMessage('Signup successful. Check your email if confirmation is enabled.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
        } else {
          setMessage('Logged in successfully.');
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const onSignOut = async () => {
    if (!supabase) return;
    setError('');
    setMessage('');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    setMessage('Logged out.');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', padding: '24px',
      position: 'relative', zIndex: 10,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, #00ff6a, #00c44f)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 30px rgba(0,255,106,0.4)', marginBottom: 16,
        fontFamily: "'Bebas Neue', cursive", fontSize: 32, color: '#000',
      }}>
        {user?.email?.[0]?.toUpperCase() || 'U'}
      </div>

      <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: '0.05em', color: '#fff', marginBottom: 6 }}>
        {user ? 'Logged In' : 'Profile'}
      </h2>
      <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
        {user?.email || 'Sign in with your account'}
      </p>

      {!user && (
        <form onSubmit={onSubmit} style={{ width: 'min(360px, 100%)', marginTop: 22, display: 'grid', gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              width: '100%', padding: '11px 12px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)',
              color: '#fff', outline: 'none', fontFamily: "'DM Mono', monospace", fontSize: 12,
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              width: '100%', padding: '11px 12px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)',
              color: '#fff', outline: 'none', fontFamily: "'DM Mono', monospace", fontSize: 12,
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              borderRadius: 10,
              border: '1px solid rgba(0,255,106,0.35)',
              background: 'rgba(0,255,106,0.12)',
              color: '#00ff6a',
              padding: '10px 12px',
              cursor: loading ? 'default' : 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Login'}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignup((v) => !v);
              setError('');
              setMessage('');
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'rgba(255,255,255,0.75)',
              cursor: 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
            }}
          >
            {isSignup ? 'Already have an account? Login' : 'No account? Sign up'}
          </button>
        </form>
      )}

      {user && (
        <button
          onClick={onSignOut}
          style={{
            marginTop: 18,
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            padding: '10px 16px',
            cursor: 'pointer',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Logout
        </button>
      )}

      {error && (
        <p style={{ marginTop: 10, color: '#ff7d7d', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
          {error}
        </p>
      )}

      {message && (
        <p style={{ marginTop: 10, color: '#9dffbf', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
          {message}
        </p>
      )}

      <div style={{ display: 'flex', gap: 40, marginTop: 24 }}>
        {[[String(likedCount), 'Liked'], [String(playedCount), 'Played']].map(([n, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: '#00ff6a' }}>{n}</p>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Minimal page skeleton
const PageSkeleton = () => (
  <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
    {[1, 2, 3].map(i => (
      <div key={i} className="shimmer" style={{ height: 80, borderRadius: 12 }} />
    ))}
  </div>
);
