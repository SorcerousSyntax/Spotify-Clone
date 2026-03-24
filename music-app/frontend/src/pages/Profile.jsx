import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { supabase } from '../lib/supabase';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notifications, setNotifications] = useState(() => {
    return localStorage.getItem('raabta_notifications') === 'true';
  });

  const likedCount = usePlayerStore((s) => s.likedSongIds.size);
  const playlistCount = usePlayerStore((s) => s.playlists.length);
  const recentlyPlayedCount = usePlayerStore((s) => s.recentlyPlayed.length);

  useEffect(() => {
    const loadUser = async () => {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setNewName(user?.user_metadata?.full_name || user?.user_metadata?.name || '');
      }
    };
    loadUser();
  }, []);

  const onSignOut = () => supabase?.auth.signOut();

  const handleUpdateName = async () => {
    if (!supabase || !newName.trim()) return;
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: newName.trim() }
    });
    if (!error) {
      setUser(data.user);
      setShowEdit(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!supabase || !newPassword.trim()) return;
    const { error } = await supabase.auth.updateUser({
      password: newPassword.trim()
    });
    if (!error) {
      setNewPassword('');
      setShowPassword(false);
      alert('Password updated successfully');
    } else {
      alert(error.message);
    }
  };

  const toggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem('raabta_notifications', String(next));
  };

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'YOU';
  const initial = name.charAt(0).toUpperCase();

  const SETTINGS_ITEMS = [
    { label: 'EDIT PROFILE', icon: '👤', onClick: () => setShowEdit(true) },
    { label: 'CHANGE PASSWORD', icon: '🔐', onClick: () => setShowPassword(true) },
    { 
      label: 'NOTIFICATIONS', 
      icon: notifications ? '🔔' : '🔕', 
      onClick: toggleNotifications,
      right: <div style={{ 
        width: 40, height: 20, borderRadius: 10, 
        background: notifications ? 'var(--pink-hot)' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: '0.3s'
      }}>
        <div style={{ 
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2, left: notifications ? 22 : 2, transition: '0.3s'
        }} />
      </div>
    },
    { label: 'AUDIO QUALITY', icon: '🎧' },
    { label: 'OFFLINE MODE', icon: '📥' },
  ];

  return (
    <div style={{ padding: '100px 20px 150px 20px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      {/* Avatar & Name */}
      <section style={{ textAlign: 'center', marginBottom: 50 }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex-center pink-glow"
          style={{
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '2px solid var(--pink-hot)',
            fontSize: 48, fontWeight: 900, color: '#fff',
            margin: '0 auto 20px auto',
            fontFamily: "'Space Grotesk', sans-serif",
            backdropFilter: 'blur(20px)'
          }}
        >
          {initial}
        </motion.div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>
          {name.toUpperCase()}<span className="text-pink">.</span>
        </h1>
        <p className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          RAABTA COMMANDER
        </p>
      </section>

      {/* Stats Row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 50 }}>
        {[
          { label: 'SONGS', value: likedCount },
          { label: 'PLAYLISTS', value: playlistCount },
          { label: 'RECENT', value: recentlyPlayedCount }
        ].map(stat => (
          <div key={stat.label} className="liquid-glass" style={{ padding: '20px 10px', textAlign: 'center', borderRadius: 24 }}>
            <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{stat.label}</p>
            <p style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Settings List */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SETTINGS_ITEMS.map(item => (
          <motion.div
            key={item.label}
            whileHover={{ x: 5, background: 'rgba(255,255,255,0.05)' }}
            onClick={item.onClick}
            className="liquid-glass"
            style={{
              padding: '18px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{item.label}</span>
            </div>
            {item.right || <span style={{ opacity: 0.3, color: '#fff' }}>→</span>}
          </motion.div>
        ))}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSignOut}
          className="btn-premium"
          style={{
            marginTop: 30, height: 60, borderRadius: 30,
            fontSize: 12, fontWeight: 900, width: '100%'
          }}
        >
          SIGN OUT
        </motion.button>
      </section>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', display: 'grid', placeItems: 'center', padding: 20 }}
          >
            <motion.div initial={{ scale: 0.9 }} className="liquid-glass" style={{ width: '100%', maxWidth: 400, padding: 40, borderRadius: 30 }}>
              <h2 style={{ fontSize: 24, marginBottom: 30 }}>EDIT PROFILE</h2>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="DISPLAY NAME"
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '2px solid var(--pink-hot)', color: '#fff', fontSize: 18, fontWeight: 900, marginBottom: 30, outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleUpdateName} className="btn-premium" style={{ flex: 1, height: 50, borderRadius: 25 }}>SAVE</button>
                <button onClick={() => setShowEdit(false)} className="btn-premium" style={{ flex: 1, height: 50, borderRadius: 25, background: 'rgba(255,255,255,0.05)' }}>CANCEL</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', display: 'grid', placeItems: 'center', padding: 20 }}
          >
            <motion.div initial={{ scale: 0.9 }} className="liquid-glass" style={{ width: '100%', maxWidth: 400, padding: 40, borderRadius: 30 }}>
              <h2 style={{ fontSize: 24, marginBottom: 30 }}>CHANGE PASSWORD</h2>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="NEW PASSWORD"
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '2px solid var(--pink-hot)', color: '#fff', fontSize: 18, fontWeight: 900, marginBottom: 30, outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleUpdatePassword} className="btn-premium" style={{ flex: 1, height: 50, borderRadius: 25 }}>UPDATE</button>
                <button onClick={() => setShowPassword(false)} className="btn-premium" style={{ flex: 1, height: 50, borderRadius: 25, background: 'rgba(255,255,255,0.05)' }}>CANCEL</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
