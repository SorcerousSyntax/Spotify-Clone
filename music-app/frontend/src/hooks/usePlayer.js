import { useEffect, useRef, useCallback } from 'react';
import { Howl, Howler } from 'howler';
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

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    if (!isIOS) return;

    // Keep iOS in media playback mode so audio can continue on lock screen.
    try {
      if (navigator.audioSession) {
        navigator.audioSession.type = 'playback';
      }
    } catch (e) {}

    try {
      Howler.autoSuspend = false;
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

      // On iOS, avoid blob/object URLs for playback because lock-screen/background
      // playback is more reliable with a direct stream URL.
      if (!isIOS && preferredUrl && window.caches) {
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
        } catch (e) {}
      }

      if (cancelled) return;

      if (howlRef.current) {
        howlRef.current.unload();
      }

      // iOS is extremely picky with source URLs. 
      // If not a blob, we provide both proxied and original to let Howler decide.
      const sources = [songSrc];
      if (!isBlob && requestedUrl && requestedUrl !== songSrc) {
        sources.push(requestedUrl);
      }

      const howl = new Howl({
        src: sources,
        html5: true, // Crucial for backgrounding on iOS
        preload: true,
        volume: isMuted ? 0 : volume,
        onload: () => {
          if (!cancelled) setDuration(howl.duration());
        },
        onplay: () => {
          setIsPlaying(true);
          updateProgress();

          // Disable analyser on iOS as it silences the HTML5 audio element
          if (!isIOS) {
            setupAnalyser();
          }

          if ('mediaSession' in navigator) {
            try {
              navigator.mediaSession.metadata = new MediaMetadata({
                title: currentSong.title,
                artist: currentSong.artist,
                album: 'Raabta',
                artwork: [{ src: currentSong.album_art_url, sizes: '512x512', type: 'image/jpeg' }]
              });
              const state = usePlayerStore.getState();
              navigator.mediaSession.setActionHandler('play', () => state.togglePlay());
              navigator.mediaSession.setActionHandler('pause', () => state.togglePlay());
              navigator.mediaSession.setActionHandler('nexttrack', () => state.nextSong());
              navigator.mediaSession.setActionHandler('previoustrack', () => state.prevSong());
              navigator.mediaSession.playbackState = 'playing';
            } catch (e) {}
          }
        },
        onpause: () => {
          setIsPlaying(false);
          if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
        },
        onend: () => {
          const { repeat, nextSong } = usePlayerStore.getState();
          if (repeat === 'one') {
            howl.seek(0);
            howl.play();
          } else {
            nextSong();
          }
        },
        onplayerror: () => {
          howl.once('unlock', () => howl.play());
        }
      });

      howlRef.current = howl;
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
  }, [currentSong?.id, currentSong?.r2_url, currentSong?.stream_url, currentSong?.url, isIOS]);

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
