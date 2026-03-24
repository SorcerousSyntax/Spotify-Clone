import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import usePlayerStore from '../store/playerStore';
import {
  OFFLINE_AUDIO_CACHE_NAME,
  getPreferredSongStreamUrl,
  getSongAudioUrlCandidates,
} from '../lib/offlineAudio';

const usePlayer = () => {
  const howlRef = useRef(null);
  const animFrameRef = useRef(null);
  const objectUrlRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const frequencyDataRef = useRef(new Uint8Array(64));

  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    progress,
    setProgress,
    setDuration,
    setIsPlaying,
    setPlayerControls,
  } = usePlayerStore();

  // iOS Audio Unlock - ensures AudioContext starts on first interaction
  useEffect(() => {
    const unlock = () => {
      // Create the context if it doesn't exist to ensure it's bound to a user gesture
      if (!audioCtxRef.current) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
      }
      
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      // Resume Howler's global context
      if (typeof Howler !== 'undefined' && Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }

      // Poke the audio engine with a silent buffer
      if (audioCtxRef.current) {
        const buffer = audioCtxRef.current.createBuffer(1, 1, 22050);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.start(0);
      }

      console.log('[Player] iOS Audio Unlocked');
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // Create/destroy Howl when song changes
  useEffect(() => {
    let cancelled = false;

    const initPlayer = async () => {
      const requestedUrl = currentSong?.url || currentSong?.stream_url || '';
      console.log('[Player] requested song.url:', requestedUrl);

      const preferredUrl = getPreferredSongStreamUrl(currentSong);
      const candidateUrls = getSongAudioUrlCandidates(currentSong);

      let songSrc = preferredUrl;
      let isBlob = false;

      if (preferredUrl && window.caches) {
        try {
          const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
          let offline = null;

          for (const url of candidateUrls) {
            const hit = await cache.match(url);
            if (hit) {
              offline = hit;
              break;
            }
          }

          if (offline) {
            const blob = await offline.blob();
            if (objectUrlRef.current) {
              URL.revokeObjectURL(objectUrlRef.current);
              objectUrlRef.current = null;
            }
            objectUrlRef.current = URL.createObjectURL(blob);
            songSrc = objectUrlRef.current;
            isBlob = true;
          }
        } catch (err) {
          console.warn('Offline audio lookup failed:', err?.message || err);
        }
      }

      if (!songSrc) return;
      if (cancelled) return;

      // Cleanup previous
      if (howlRef.current) {
        howlRef.current.unload();
      }

      // iOS Safari often fails on proxied URLs if the proxy doesn't support Range requests perfectly.
      // We provide the preferred (proxied) URL first, but Howler allows multiple sources.
      // We'll also add the raw original URL as a second candidate.
      const sources = [songSrc];
      if (!isBlob && requestedUrl && requestedUrl !== songSrc) {
        sources.push(requestedUrl);
      }

      const howl = new Howl({
        src: sources,
        html5: true, // Required for long audio and background play
        preload: true,
        volume: isMuted ? 0 : volume,
        onload: () => {
          setDuration(howl.duration());
        },
        onplay: () => {
          setIsPlaying(true);
          updateProgress();
          setupAnalyser();
          
          // Media Session API for Lock Screen & Background Playback
          try {
            if ('mediaSession' in navigator && window.MediaMetadata && currentSong) {
              navigator.mediaSession.metadata = new MediaMetadata({
                title: currentSong.title,
                artist: currentSong.artist,
                album: currentSong.album || 'Raabta',
                artwork: [
                  { src: currentSong.album_art_url, sizes: '512x512', type: 'image/jpeg' }
                ]
              });

              const state = usePlayerStore.getState();
              navigator.mediaSession.setActionHandler('play', () => {
                if (!usePlayerStore.getState().isPlaying) state.togglePlay();
              });
              navigator.mediaSession.setActionHandler('pause', () => {
                if (usePlayerStore.getState().isPlaying) state.togglePlay();
              });
              navigator.mediaSession.setActionHandler('previoustrack', () => state.prevSong());
              navigator.mediaSession.setActionHandler('nexttrack', () => state.nextSong());
              
              // Set playback state to 'playing'
              navigator.mediaSession.playbackState = 'playing';
            }
          } catch (e) {
            console.warn('MediaSession metadata/handler setup failed:', e);
          }
        },
        onpause: () => {
          setIsPlaying(false);
          cancelAnimationFrame(animFrameRef.current);
          try {
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'paused';
            }
          } catch (e) {
            console.warn('MediaSession state update failed:', e);
          }
        },
        onend: () => {
          cancelAnimationFrame(animFrameRef.current);
          const { repeat: currentRepeat, nextSong: playNextSong } = usePlayerStore.getState();
          if (currentRepeat === 'one') {
            howl.seek(0);
            howl.play();
          } else {
            playNextSong();
          }
        },
        onstop: () => {
          cancelAnimationFrame(animFrameRef.current);
        },
        onloaderror: (id, err) => {
          console.error('Howler load error:', err);
        },
      });

      howlRef.current = howl;
      console.log('[Player] calling howl.play()');
      howl.play();

    };

    initPlayer();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      if (howlRef.current) {
        howlRef.current.unload();
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [currentSong?.id, currentSong?.r2_url, currentSong?.stream_url, currentSong?.url]);

  // Sync play/pause state
  useEffect(() => {
    if (!howlRef.current) return;
    if (isPlaying && !howlRef.current.playing()) {
      howlRef.current.play();
    } else if (!isPlaying && howlRef.current.playing()) {
      howlRef.current.pause();
    }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    if (!howlRef.current) return;
    howlRef.current.volume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // Update progress loop
  const updateProgress = useCallback(() => {
    if (howlRef.current && howlRef.current.playing()) {
      setProgress(howlRef.current.seek());
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [setProgress]);

  // Set up Web Audio API analyser for waveform
  const setupAnalyser = useCallback(() => {
    if (analyserRef.current && audioCtxRef.current?.state !== 'suspended') return;

    try {
      if (!audioCtxRef.current) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
      }

      // Try getting the Howler internal audio node
      const howlNode = howlRef.current?._sounds?.[0]?._node;
      if (howlNode && !sourceRef.current) {
        const source = ctx.createMediaElementSource(howlNode);
        source.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
        sourceRef.current = source;
      }
    } catch (e) {
      // Web Audio API may not be available or node already connected
      console.warn('Could not set up audio analyser:', e.message);
    }
  }, []);

  // Seek to position
  const seek = useCallback((time) => {
    if (howlRef.current) {
      howlRef.current.seek(time);
      setProgress(time);
    }
  }, [setProgress]);

  // Get frequency data for waveform
  const getFrequencyData = useCallback(() => {
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(frequencyDataRef.current);
      return frequencyDataRef.current;
    }
    return new Uint8Array(64);
  }, []);

  useEffect(() => {
    setPlayerControls({ seek, getFrequencyData });
    return () => {
      setPlayerControls({
        seek: () => {},
        getFrequencyData: () => new Uint8Array(64),
      });
    };
  }, [seek, getFrequencyData, setPlayerControls]);

  return {
    seek,
    getFrequencyData,
    howlRef,
  };
};

export default usePlayer;
