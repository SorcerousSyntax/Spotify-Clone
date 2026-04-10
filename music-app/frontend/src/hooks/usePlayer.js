import { useEffect, useRef, useCallback } from 'react';
import { Howl, Howler } from 'howler';
import usePlayerStore from '../store/playerStore';
import {
  OFFLINE_AUDIO_CACHE_NAME,
  getPreferredSongStreamUrl,
  getSongAudioUrlCandidates,
} from '../lib/offlineAudio';

// Disable Howler's auto-suspend globally — must be set before any Howl is created.
// Without this, iOS/Android background audio becomes unreliable.
try { Howler.autoSuspend = false; } catch (_e) {}

const SAFE_OUTPUT_HEADROOM = 0.82;
const IOS_SAFE_OUTPUT_HEADROOM = 0.66;

const usePlayer = () => {
  const howlRef = useRef(null);
  const animFrameRef = useRef(null);
  const objectUrlRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const lowShelfRef = useRef(null);
  const presenceDipRef = useRef(null);
  const highShelfRef = useRef(null);
  const compressorRef = useRef(null);
  const outputGainRef = useRef(null);
  const frequencyDataRef = useRef(new Uint8Array(64));
  const wasPlayingBeforeHideRef = useRef(false);
  const resumeAttemptsRef = useRef(0);

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

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const outputHeadroom = isIOS ? IOS_SAFE_OUTPUT_HEADROOM : SAFE_OUTPUT_HEADROOM;

  const updateMediaSessionMetadata = useCallback((song) => {
    if (!song || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;

    const title = song.title || 'Unknown Title';
    const artist = song.artist || 'Unknown Artist';
    const artworkSrc = song.album_art_url || '/placeholder-album.svg';

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album: song.album || 'Raabta',
        // Skip strict "type" so browsers don't reject non-jpeg artwork URLs.
        artwork: [96, 128, 192, 256, 384, 512].map((size) => ({
          src: artworkSrc,
          sizes: `${size}x${size}`,
        })),
      });
    } catch (_error) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album: song.album || 'Raabta' });
      } catch (_innerError) {}
    }
  }, []);

  const setMediaSessionHandlers = useCallback(() => {
    if (!('mediaSession' in navigator)) return;
    const state = usePlayerStore.getState();

    const handlers = {
      play: () => state.togglePlay(),
      pause: () => state.togglePlay(),
      nexttrack: () => state.nextSong(),
      previoustrack: () => state.prevSong(),
    };

    Object.entries(handlers).forEach(([action, fn]) => {
      try {
        navigator.mediaSession.setActionHandler(action, fn);
      } catch (_error) {}
    });
  }, []);

  const updateMediaSessionPosition = useCallback((position, durationValue) => {
    if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    if (!Number.isFinite(durationValue) || durationValue <= 0) return;

    const boundedPosition = Math.max(0, Math.min(Number(position) || 0, durationValue));
    try {
      navigator.mediaSession.setPositionState({
        duration: durationValue,
        playbackRate: 1,
        position: boundedPosition,
      });
    } catch (_error) {}
  }, []);

  useEffect(() => {
    // Keep iOS in media playback mode so audio can continue on lock screen.
    if (!isIOS) return;
    try {
      if (navigator.audioSession) {
        navigator.audioSession.type = 'playback';
      }
    } catch (e) {}
  }, [isIOS]);

  // iOS Audio Unlock - critical for both Safari and PWA mode
  useEffect(() => {
    const unlock = () => {
      console.log('[Player] iOS Gesture Unlock');
      try {
        if (typeof Howler !== 'undefined') {
          Howler.mute(false);
          if (Howler.ctx && Howler.ctx.state === 'suspended') {
            Howler.ctx.resume();
          }
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
          if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
        }
      } catch (e) {
        console.warn('Unlock error:', e);
      }
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
      if (!currentSong) return;

      const requestedUrl = currentSong.stream_url || currentSong.url || currentSong.r2_url || '';
      const preferredUrl = getPreferredSongStreamUrl(currentSong);
      const candidateUrls = getSongAudioUrlCandidates(currentSong);

      let songSrc = preferredUrl;
      let isBlob = false;

      // Always check the offline cache first on every platform.
      // On iOS a blob URL is actually *more* reliable than the network proxy
      // inside a PWA/Safari context because it avoids CORS/range-request issues.
      if (preferredUrl && window.caches) {
        try {
          const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
          for (const url of candidateUrls) {
            const hit = await cache.match(url);
            if (hit) {
              const blob = await hit.blob();
              if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
              objectUrlRef.current = URL.createObjectURL(blob);
              songSrc = objectUrlRef.current;
              isBlob = true;
              break;
            }
          }
        } catch (e) { /* cache unavailable — fall through to network */ }
      }

      if (cancelled) return;

      if (howlRef.current) {
        howlRef.current.unload();
      }

      // iOS is extremely picky with source URLs. 
      // If not a blob, we provide both proxied and original to let Howler decide.
      const sources = [songSrc, !isBlob ? requestedUrl : null]
        .filter(Boolean)
        .filter((value, index, arr) => arr.indexOf(value) === index);

      if (sources.length === 0) {
        console.warn('[Player] No playable audio source for song', currentSong?.id);
        setIsPlaying(false);
        return;
      }

      const howl = new Howl({
        src: sources,
        html5: true, // Crucial for backgrounding on iOS
        preload: true,
        volume: isMuted ? 0 : (volume * outputHeadroom),
        onload: () => {
          if (!cancelled) setDuration(howl.duration());
        },
        onplay: () => {
          setIsPlaying(true);
          updateProgress();

          // Ensure iOS audio session stays in playback mode (important for lock screen)
          try {
            if (navigator.audioSession) navigator.audioSession.type = 'playback';
          } catch (_e) {}

          // Avoid routing HTML5 audio through WebAudio on mobile to prevent silent playback.
          if (!isIOS && !isAndroid) {
            setupAnalyser();
          }

          if ('mediaSession' in navigator) {
            updateMediaSessionMetadata(currentSong);
            setMediaSessionHandlers();
            navigator.mediaSession.playbackState = 'playing';
            updateMediaSessionPosition(howl.seek(), howl.duration());
          }
        },
        onpause: () => {
          setIsPlaying(false);
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
            updateMediaSessionPosition(howl.seek(), howl.duration());
          }
        },
        onend: () => {
          const { repeat, nextSong } = usePlayerStore.getState();
          if (repeat === 'one') {
            howl.seek(0);
            howl.play();
          } else {
            const advanced = nextSong();
            if (!advanced) {
              setIsPlaying(false);
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'none';
              }
            }
          }
        },
        onplayerror: (_id, err) => {
          console.warn('[Player] playback error, attempting unlock:', err);
          howl.once('unlock', () => howl.play());
        },
        onloaderror: async (_id, err) => {
          console.warn('[Player] load error, trying cache fallback:', err);
          // If the network URL failed, try serving from the offline cache as a blob.
          if (!isBlob && window.caches) {
            try {
              const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
              for (const url of candidateUrls) {
                const hit = await cache.match(url);
                if (hit) {
                  const blob = await hit.blob();
                  if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
                  objectUrlRef.current = URL.createObjectURL(blob);

                  if (cancelled) return;

                  const fallbackHowl = new Howl({
                    src: [objectUrlRef.current],
                    html5: true,
                    volume: isMuted ? 0 : (volume * outputHeadroom),
                    onload: () => { if (!cancelled) setDuration(fallbackHowl.duration()); },
                    onplay: () => {
                      setIsPlaying(true);
                      updateProgress();
                    },
                    onpause: () => setIsPlaying(false),
                    onend: () => {
                      const { repeat, nextSong } = usePlayerStore.getState();
                      if (repeat === 'one') { fallbackHowl.seek(0); fallbackHowl.play(); }
                      else { if (!nextSong()) setIsPlaying(false); }
                    },
                    onloaderror: () => { console.warn('[Player] Cache fallback also failed.'); setIsPlaying(false); },
                  });
                  howlRef.current = fallbackHowl;
                  fallbackHowl.play();
                  return;
                }
              }
            } catch (_cacheErr) {}
          }
          setIsPlaying(false);
        },
      });

      howlRef.current = howl;
      howl.play();
    };

    initPlayer();

    return () => {
      cancelled = true;
      // Cancel both RAF and timeout variants of the progress loop.
      cancelAnimationFrame(animFrameRef.current);
      clearTimeout(animFrameRef.current);
      if (howlRef.current) {
        howlRef.current.unload();
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [currentSong?.id, currentSong?.r2_url, currentSong?.stream_url, currentSong?.url, isIOS, isAndroid, outputHeadroom, setDuration, setIsPlaying, setMediaSessionHandlers, updateMediaSessionMetadata, updateMediaSessionPosition]);

  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return;
    updateMediaSessionMetadata(currentSong);
    setMediaSessionHandlers();
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [currentSong, isPlaying, setMediaSessionHandlers, updateMediaSessionMetadata]);

  useEffect(() => {
    const tryResumePlayback = () => {
      const howl = howlRef.current;
      if (!howl || !isPlaying) return;
      if (howl.playing()) {
        resumeAttemptsRef.current = 0;
        return;
      }

      // Prevent aggressive loops: retry only a few times while app is in background.
      if (resumeAttemptsRef.current >= 4) return;
      resumeAttemptsRef.current += 1;

      try {
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
          Howler.ctx.resume();
        }
      } catch (_error) {}

      try {
        howl.play();
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      } catch (_error) {}
    };

    const onVisibilityChange = () => {
      const hidden = document.visibilityState === 'hidden';
      if (hidden) {
        wasPlayingBeforeHideRef.current = isPlaying;
        return;
      }

      // App became visible again: if user expected playback, recover quickly.
      if (wasPlayingBeforeHideRef.current && isPlaying) {
        tryResumePlayback();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    // Watchdog for lock-screen/background interruptions.
    const watchdog = window.setInterval(() => {
      if (!document.hidden) return;
      if (!isPlaying) return;
      tryResumePlayback();
    }, 8000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(watchdog);
    };
  }, [isPlaying]);

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
    howlRef.current.volume(isMuted ? 0 : (volume * outputHeadroom));
  }, [volume, isMuted, outputHeadroom]);

  // Update progress loop — iOS thermal management:
  //   • Visible / screen on  → 60 fps via requestAnimationFrame (smooth UI)
  //   • Hidden / locked screen → 4 fps via setTimeout (audio keeps playing but
  //     the JS loop rate drops dramatically, cutting CPU heat by ~85%)
  const msPositionTimerRef = useRef(0);
  const updateProgress = useCallback(() => {
    if (!howlRef.current || !howlRef.current.playing()) return;

    const position = howlRef.current.seek();
    const currentDuration = howlRef.current.duration();
    setProgress(position);

    // Throttle MediaSession position updates to once every 5 s (lock screen
    // only needs the position for scrubbing, not for every animation frame).
    const now = Date.now();
    if (now - msPositionTimerRef.current > 5000) {
      msPositionTimerRef.current = now;
      updateMediaSessionPosition(position, currentDuration);
    }

    if (document.hidden) {
      // Background / lock screen: very low rate to keep CPU cool.
      animFrameRef.current = setTimeout(updateProgress, 250);
    } else {
      // Foreground: buttery smooth.
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [setProgress, updateMediaSessionPosition]);

  // Set up Web Audio API analyser for waveform
  const setupAnalyser = useCallback(() => {
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

      if (!lowShelfRef.current) {
        const lowShelf = ctx.createBiquadFilter();
        lowShelf.type = 'lowshelf';
        lowShelf.frequency.value = 130;
        lowShelf.gain.value = 1.8;
        lowShelfRef.current = lowShelf;
      }

      if (!presenceDipRef.current) {
        const presenceDip = ctx.createBiquadFilter();
        presenceDip.type = 'peaking';
        presenceDip.frequency.value = 3600;
        presenceDip.Q.value = 1.1;
        presenceDip.gain.value = -2.6;
        presenceDipRef.current = presenceDip;
      }

      if (!highShelfRef.current) {
        const highShelf = ctx.createBiquadFilter();
        highShelf.type = 'highshelf';
        highShelf.frequency.value = 9200;
        highShelf.gain.value = -2.8;
        highShelfRef.current = highShelf;
      }

      if (!compressorRef.current) {
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -19;
        compressor.knee.value = 22;
        compressor.ratio.value = 2.5;
        compressor.attack.value = 0.005;
        compressor.release.value = 0.2;
        compressorRef.current = compressor;
      }

      if (!outputGainRef.current) {
        const outputGain = ctx.createGain();
        outputGain.gain.value = 0.92;
        outputGainRef.current = outputGain;
      }

      // Try getting the Howler internal audio node
      const howlNode = howlRef.current?._sounds?.[0]?._node;
      if (howlNode && !sourceRef.current) {
        const source = ctx.createMediaElementSource(howlNode);
        source.connect(lowShelfRef.current);
        lowShelfRef.current.connect(presenceDipRef.current);
        presenceDipRef.current.connect(highShelfRef.current);
        highShelfRef.current.connect(compressorRef.current);
        compressorRef.current.connect(outputGainRef.current);
        outputGainRef.current.connect(analyserRef.current);
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
