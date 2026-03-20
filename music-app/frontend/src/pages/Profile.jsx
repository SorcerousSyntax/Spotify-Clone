import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { supabase } from '../lib/supabase';

const Profile = () => {
  const [user, setUser] = useState(null);
  const likedCount = usePlayerStore((s) => s.likedSongIds.size);
  const playlistCount = usePlayerStore((s) => s.playlists.length);
  const recentlyPlayedCount = usePlayerStore((s) => s.recentlyPlayed.length);

  useEffect(() => {
    const loadUser = async () => {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      }
    };
    loadUser();
  }, []);

  const onSignOut = () => supabase?.auth.signOut();

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'YOU';
  const initial = name.charAt(0).toUpperCase();

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
            background: 'var(--glass-bg)',
            border: '2px solid var(--pink-hot)',
            fontSize: 48, fontWeight: 900, color: '#fff',
            margin: '0 auto 20px auto',
            fontFamily: "'Space Grotesk', sans-serif"
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
          <div key={stat.label} className="glass" style={{ padding: '20px 10px', textAlign: 'center' }}>
            <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{stat.label}</p>
            <p style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Settings List */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'ACCOUNT SETTINGS', icon: '👤' },
          { label: 'AUDIO QUALITY', icon: '🎧' },
          { label: 'OFFLINE MODE', icon: '📥' },
          { label: 'APPEARANCE', icon: '✨' },
          { label: 'SUPPORT', icon: '💬' }
        ].map(item => (
          <motion.div
            key={item.label}
            whileHover={{ x: 5, background: 'var(--glass-bg)' }}
            className="glass"
            style={{
              padding: '18px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', border: '1px solid var(--glass-border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{item.label}</span>
            </div>
            <span style={{ opacity: 0.3 }}>→</span>
          </motion.div>
        ))}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSignOut}
          style={{
            marginTop: 30, height: 60, borderRadius: 30, background: 'rgba(255,45,120,0.1)',
            border: '1px solid var(--pink-hot)', color: 'var(--pink-hot)',
            fontSize: 12, fontWeight: 900, cursor: 'pointer'
          }}
        >
          SIGN OUT
        </motion.button>
      </section>
    </div>
  );
};

export default Profile;
