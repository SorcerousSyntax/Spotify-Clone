import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import { supabase } from '../lib/supabase';
import { decodeSongTitle } from '../lib/text';

const SEARCH_QUERIES = ['trending hindi songs', 'arijit singh', 'romantic bollywood'];

const isPlayableSong = (song) => Boolean(song?.stream_url || song?.r2_url || song?.url);

const normalizeSong = (song = {}) => ({
  ...song,
  id: song.id || song.song_id || `${song.title || song.name || 'song'}-${song.artist || song.primaryArtists || 'artist'}`,
  title: song.title || song.name || 'Unknown Title',
  artist: song.artist || song.primaryArtists || 'Unknown Artist',
  album_art_url: song.album_art_url || song.albumArt || song.album_art || '/placeholder-album.svg',
  stream_url: song.stream_url || song.url || song.r2_url || '',
  url: song.url || song.stream_url || song.r2_url || '',
  r2_url: song.r2_url || song.stream_url || song.url || '',
});

const Home = () => {
  const navigate = useNavigate();
  const [bannerName, setBannerName] = useState('User');
  const [recentFromApi, setRecentFromApi] = useState([]);
  const [suggestedSong, setSuggestedSong] = useState(null);

  const recentFromStore = usePlayerStore((s) => s.recentlyPlayed);
  const likedSongIds = usePlayerStore((s) => s.likedSongIds);
  const songsById = usePlayerStore((s) => s.songsById);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);

  useEffect(() => {
    let mounted = true;

    const loadBannerName = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user || !mounted) return;

      const candidate =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')?.[0] ||
        'User';
      const firstName = String(candidate).trim().split(/[\s._@+\d]+/).filter(Boolean)[0] || 'User';
      const formatted = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      setBannerName(formatted);
    };

    loadBannerName().catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadRecent = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('play_history')
        .select('*')
        .order('played_at', { ascending: false })
        .limit(12);

      if (error) {
        console.error('Supabase Home history fetch error:', error);
        return;
      }

      if (mounted && Array.isArray(data)) {
        setRecentFromApi(data.map((row) => normalizeSong({
          id: row.song_id,
          title: row.title,
          artist: row.artist,
          album_art_url: row.album_art,
          url: row.url,
          stream_url: row.url,
          r2_url: row.url,
        })));
      }
    };

    loadRecent().catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSuggestion = async () => {
      for (const query of SEARCH_QUERIES) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (!res.ok) continue;
          const data = await res.json();
          const results = Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.songs)
              ? data.songs
              : [];

          const playable = results.map(normalizeSong).find(isPlayableSong);
          if (playable && mounted) {
            setSuggestedSong(playable);
            return;
          }
        } catch {
          // Keep trying with next query.
        }
      }
    };

    loadSuggestion();
    return () => {
      mounted = false;
    };
  }, []);

  const likedSongs = useMemo(() => {
    return [...likedSongIds]
      .map((id) => songsById[id])
      .filter(Boolean)
      .map(normalizeSong)
      .filter(isPlayableSong);
  }, [likedSongIds, songsById]);

  const recentSongs = useMemo(() => {
    const merged = [...recentFromApi, ...recentFromStore.map(normalizeSong), ...likedSongs];
    const seen = new Set();
    const result = [];

    for (const song of merged) {
      if (!song?.id || seen.has(song.id) || !isPlayableSong(song)) continue;
      seen.add(song.id);
      result.push(song);
      if (result.length === 8) break;
    }

    return result;
  }, [recentFromApi, recentFromStore, likedSongs]);

  const forYouSongs = useMemo(() => {
    const merged = [suggestedSong, ...recentSongs].filter(Boolean);
    const seen = new Set();
    const result = [];

    for (const song of merged) {
      if (!song?.id || seen.has(song.id) || !isPlayableSong(song)) continue;
      seen.add(song.id);
      result.push(song);
      if (result.length === 8) break;
    }

    return result;
  }, [suggestedSong, recentSongs]);

  const playSong = (song, index, queue) => {
    const normalized = normalizeSong(song);
    if (!isPlayableSong(normalized)) {
      navigate('/search');
      return;
    }
    const normalizedQueue = queue.map(normalizeSong);
    setCurrentSong(normalized);
    setQueue(normalizedQueue, index);
    navigate('/now-playing');
  };

  const handleStartListening = () => {
    const candidate = forYouSongs[0] || recentSongs[0] || currentSong;
    if (!candidate) {
      navigate('/search');
      return;
    }
    const sourceQueue = forYouSongs.length ? forYouSongs : recentSongs;
    const idx = sourceQueue.findIndex((song) => song.id === candidate.id);
    playSong(candidate, Math.max(0, idx), sourceQueue.length ? sourceQueue : [candidate]);
  };

  const homeCards = useMemo(() => {
    if (forYouSongs.length) return forYouSongs;

    return [
      normalizeSong({ id: 'fallback-1', title: 'Daft Punk - Random', artist: 'Access Memories', album_art_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5RE2GFyVCFFjuIGS8MI--DLbMe3xb6ulIdM69AD9dCJVXi55Da-R6KjBAxEqU8AXDCgBQPvqzAlHC8IpFDd4F2hvpPWlnBqffIEUADCPSoUJFJHCKa0Fp46dOBmL_SzwosllVmg7Qpj_4DM9zFJoo8LYTwOqWbMWRcSJWIlt6fil9DLCvlMY4CggdqmElyLo4lDO2d4fyTDdG1NMlYnaew7X6jLxR3KMa6EvXz-iSlWMmqHS6oFphfD0ROaiOCu5V4Tuoc962EIXZ' }),
      normalizeSong({ id: 'fallback-2', title: 'The Weeknd -', artist: 'After Hours', album_art_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB92Pnz6p4vMzH_gJSjk058AlcQ4ivdnLqUESMqe8zuV2q6cPILysgxUHcVmUO_a4Y6cWIPscqWBZwph-0IPbCiBf3G6LYYL7v1Ev2Ajbb0P7IO5W1Z8YX_nPPFV-NbBYbFnn-CUev46EVNIp8Ay2W46p6VD7d9IpZOgOhL742cvOTKcGRi3XrsLl64vRlkQ34tWayucbBie-F4pWUOGk0Nz2Bt-4k_0OFv2NIia_kY87PJDptJ5kdcCTvEYcB4ctMuztk1lAwH3G-P' }),
      normalizeSong({ id: 'fallback-3', title: 'The Weend -', artist: 'Romantus', album_art_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3M82kvVL9I605vIdbasS72-K6jtON25CBKbm-ZcnIDzjI8VX9Q30MlwNLfH-M34_UKUSlLSY0JECaZZesQzffWrS9qQF3rfpdHHtsmPnX9fT0AacV7yYgmtZNzycKRuEg-8gk-z6rcDnyRs6hMj0QocXqkcuZkp1Lf4Alay3WSBx5yZG8HCO3Auaiby4Dp4icNjgD6qwhFjFBCBGS_L5KB--W-k60x8hxtSUBRRX0PMHgHSTJSYqwpg1c8Wva7W9d5fgD8jNHpVEk' }),
      normalizeSong({ id: 'fallback-4', title: 'The Black - The Kien', artist: 'Now', album_art_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJclhjoAoL_hCGg90BHJo_JuGFK8cPuccFeVpfsCWwOHHvuorYc0L8dZPIm4b2TPPqEVq30kdVyv68jnqHsK3DFNUAXEVOYqvcIs0gOTBiYg51EX2B-8RLyO1xOl31dTyTXtVlV0X05oBx3Nd3RMJ9SslhWbpLJ3eKtkf8asBjyWk6Ss_gt-iw1tQxUiKBYpplAgr3s07N1UfHaxYBPMA8Znx2ZKhAiMauTjqacZYMv4upfw743F282NpgVOrTQR0VdO4QA8XZTL8-' }),
      normalizeSong({ id: 'fallback-5', title: 'Daft Punk - The', artist: 'Thregs', album_art_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfBcetbQxL6h3Q-MB-RIldsMNTwGsNqFxPqlPuz5L7h3lCZMYph5zmQ0mPmpbIWqfd9YQyU8r1gqItZ69kAY8Dx4W6R_S_YCD_wHkZkWssa-gjvykoO5Zg8I8po2GTdv4vVxC_XwG1OnK9-Xy0pwGJQIreUJO7KM2LP92csbF-wD3vTr3QQYufhlXsOwVEIDsNfSMJ3O3U5G7bEKfiGiqR9JquaeOQZD_wr0BnOlyExbZ70FYO0dRHojYNqD3BO3S84ztk3d3xsBT5' }),
      normalizeSong({ id: 'fallback-6', title: 'The Weeknd -', artist: 'Women Cimmor', album_art_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIkhLdgu4FTrgDaJx98kfnI2hBkJYHFYZQ-wWzhC4-DhWgjMDPFX8VMuIvt_RQTDF9kUp-RHUlQPbqvi0eocdZ6v28jAKvCTzPkgb_SDjOaivT0LZidIej3A7lOlumUYqNPSriMWkgYgB-SMx2Cy_JXBxsK3YzTNKvn3HZtY5cWHpPNaoCe04phSb3jL1lnDIO76jWLtBumj9eAYOws8Zmy4ijHHf4CLZEESggc__B6dHDW-H6jhD10a7RLa9gLUZD7ndcmt58K2LO' }),
      normalizeSong({ id: 'fallback-7', title: 'The Rown - Mlek', artist: 'Harkur', album_art_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNrNp7FiEiPJnrJLBsELL2hM-ULAHOiUVBjHWTkZjKwHk8TxnIxjHK_8hMpTGWfRa43b6kiz06v85CBBaUJk4LOZOpzhS_YEmuDLh7v0As_HAncTNQUCvHHCd1dinRiLG6mUgqvic_j0QtnWEOHK3WaCmYfdHFyrdiA4Z5q6O3iZh81kB5wODkAPl3AJNiULDE75c_mAxLnMnOjTbXzLqjAjnfeDgQawKsW3OEsx8tX8h2Pdc0cPDBeGy6MdDvDqNUYjLc8hTrMHON' }),
      normalizeSong({ id: 'fallback-8', title: 'Steve Mega -', artist: 'Aatreotore', album_art_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD20SnpHn9LlyuLFMU6ocvLTEgIiajObverkxA_BcIo-CZ-0mIXMM85ZESemDenywk7OEAGu4tip1WPAiC1vbyoDfbEZ-0mFB5xvEY8sSTxFxP7roTuucn8m24fDnLB7_21yJvwTkvHdcFPLy1fdaona9Xk4ZzR7Y2_ksr1W89Orjao2OwzNGgXhjH2RVwIL5UXTpUwh5ZnKpNTLHjjL6IZK6-xaUXPjxZKvPbm7Pv3aLWOtJaS2L8sEV0CI3EmN74QOvd3mgSpNaXA' }),
    ];
  }, [forYouSongs]);

  const recentRows = useMemo(() => {
    const rows = recentSongs.slice(0, 3);
    if (rows.length) return rows;
    return homeCards.slice(0, 3);
  }, [recentSongs, homeCards]);

  return (
    <>
      <style>{`
        .home-page-root {
          background-color: #080808;
          color: #fff;
          font-family: 'Space Grotesk', sans-serif;
          min-height: calc(100dvh - 54px);
          position: relative;
          overflow-x: hidden;
          z-index: 10;
        }
        .glass-nav {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(168, 85, 247, 0.5);
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.2);
        }
        .hero-glow {
          box-shadow: 0 0 20px rgba(255, 0, 255, 0.4);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(168, 85, 247, 0.4);
          border-radius: 12px;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.15);
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 0, 255, 0.5);
          box-shadow: 0 0 15px rgba(255, 0, 255, 0.2);
        }
      `}</style>

      <div className="home-page-root">
        <div className="fixed top-20 left-10 w-16 h-16 bg-white opacity-10 rounded-sm transform rotate-45 blur-sm pointer-events-none" />
        <div className="fixed top-40 right-20 w-12 h-12 bg-white opacity-20 rounded-full blur-md pointer-events-none" />
        <div className="fixed bottom-20 left-32 w-8 h-8 bg-white opacity-10 rounded-full blur-sm pointer-events-none" />

        <header className="w-full flex justify-center pt-8 z-50 relative">
          <nav className="px-12 py-3 flex space-x-12 justify-center items-center w-[60%] mx-auto bg-[#181818] rounded-[30px] border border-[rgba(168,85,247,0.6)] shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <button className="text-white font-medium hover:text-fuchsia-400 transition-colors" onClick={() => navigate('/')} type="button">Home</button>
            <button className="text-gray-400 font-medium hover:text-fuchsia-400 transition-colors" onClick={() => navigate('/search')} type="button">Explore</button>
            <button className="text-gray-400 font-medium hover:text-fuchsia-400 transition-colors" onClick={() => navigate('/library')} type="button">Library</button>
          </nav>
        </header>

        <main className="max-w-[1200px] mx-auto w-full pt-16 pb-24 relative z-10">
          <section className="flex flex-col md:flex-row items-center justify-between mb-24 relative">
            <div className="w-full md:w-[30%] z-10">
              <h1 className="text-5xl font-semibold mb-4 text-white drop-shadow-lg">Hello, {bannerName}</h1>
              <p className="text-gray-400 mb-8 max-w-sm text-sm">Ultra high definition weights,<br />Space Grotesk</p>
              <button className="px-6 py-2 rounded-full border border-fuchsia-500 text-white hover:bg-fuchsia-900/30 transition-all hero-glow" onClick={handleStartListening} type="button">
                Start Listening
              </button>
            </div>

            <div className="w-full md:w-[70%] flex justify-center relative mt-12 md:mt-0 h-64 md:h-[500px]">
              <img
                alt="Crystal Pyramid"
                className="object-contain w-full h-full drop-shadow-[0_0_30px_rgba(255,0,255,0.3)]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDvyNGgzOZPty9MqzBR1iuaqWRmcT6F5s3xq7BgSa_otVG8TQBEEnhwgR2pETQ5kDt1y_rimJLI6W8Sd1qB12tA-xGHcjl0RIPhywIDKS1lHhAoeGevyRVsi26NgMY1xl_q4z_68lw6kSRNffLMWbdzPqIETj4rE448jQTusDS5Dd6sT466FRntFe6OIOiE9ogLqa0kPY285xya1LcRzQQThP-2EuK6RmH34gnTYMMFK5XMavr5JCkGenf5oBpOClqALNhdcd3EzwJ"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl mx-auto pl-12 pr-12 w-full">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-6 text-white">For You</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {homeCards.slice(0, 8).map((song, index) => (
                  <AlbumCard
                    key={song.id || `home-card-${index}`}
                    title={decodeSongTitle(song.title || song.name || 'Unknown Title')}
                    subtitle={(song.artist || song.primaryArtists || 'Unknown Artist').replace(/&amp;/g, '&')}
                    image={song.album_art_url || '/placeholder-album.svg'}
                    pinkBackdrop={index === 5}
                    onClick={() => playSong(song, index, homeCards.slice(0, 8))}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-6 text-white">Recently Played</h2>
              <div className="flex flex-col space-y-4">
                {recentRows.map((song, index) => (
                  <RecentRow
                    key={song.id || `recent-row-${index}`}
                    title={decodeSongTitle(song.title || song.name || 'Unknown Title')}
                    subtitle={(song.artist || song.primaryArtists || 'Unknown Artist').replace(/&amp;/g, '&')}
                    image={song.album_art_url || '/placeholder-album.svg'}
                    compact={index === 1}
                    active={currentSong?.id === song.id || index === 2}
                    onClick={() => playSong(song, index, recentRows)}
                  />
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

const AlbumCard = ({ title, subtitle, image, pinkBackdrop = false, onClick }) => (
  <button className="glass-card rounded-xl p-2 cursor-pointer flex flex-col group border border-purple-500/30 text-left" onClick={onClick} type="button">
    <div className={`aspect-square rounded-lg overflow-hidden mb-3 ${pinkBackdrop ? 'bg-rose-500/80 p-6 flex items-center justify-center' : 'bg-gray-800'}`}>
      <img alt={title} className={`object-cover ${pinkBackdrop ? 'w-16 h-16 shadow-lg' : 'w-full h-full'}`} src={image} />
    </div>
    <div className="px-1">
      <h3 className="text-xs font-medium text-white line-clamp-1">{title}</h3>
      <p className="text-[10px] text-gray-400 line-clamp-1">{subtitle}</p>
    </div>
  </button>
);

const RecentRow = ({ title, subtitle, image, compact = false, active = false, onClick }) => (
  <button className={`rounded-xl p-2 flex items-center group cursor-pointer bg-[#1a1a1a] rounded-[12px] w-full text-left ${active ? 'border border-fuchsia-500/50 shadow-[0_0_10px_rgba(255,0,255,0.2)]' : 'border border-gray-600'}`} onClick={onClick} type="button">
    <div className={`w-14 h-14 overflow-hidden bg-gray-800 mr-4 flex-shrink-0 rounded-[4px] ${compact ? 'flex items-center justify-center' : ''}`}>
      <img alt={title} className={compact ? 'w-10 h-10 object-cover shadow-md' : 'w-full h-full object-cover'} src={image} />
    </div>
    <div className="flex-grow pr-4">
      <h3 className="text-xs font-medium text-white truncate">{title}</h3>
      <p className="text-[10px] text-gray-400 truncate mt-1">{subtitle}</p>
    </div>
    <span className="text-gray-400 hover:text-white px-2" aria-hidden="true">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </span>
  </button>
);

export default Home;
