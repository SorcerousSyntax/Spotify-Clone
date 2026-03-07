import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import usePlayerStore from '../store/playerStore';

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
    repeat,
    progress,
    setProgress,
    setDuration,
    setIsPlaying,
    nextSong,
    setPlayerControls,
  } = usePlayerStore();

  // Create/destroy Howl when song changes
  useEffect(() => {
    let cancelled = false;

    const initPlayer = async () => {
      const requestedUrl = currentSong?.url || currentSong?.stream_url || '';
      console.log('[Player] requested song.url:', requestedUrl);

      const isInlineAudio =
        typeof currentSong?.r2_url === 'string' &&
        currentSong.r2_url.startsWith('data:');
      const rawStreamUrl =
        currentSong?.stream_url ||
        currentSong?.url ||
        (currentSong?.id && currentSong?.r2_url && !isInlineAudio
          ? `/api/songs/${currentSong.id}/stream`
          : currentSong?.r2_url);

      const streamUrl =
        typeof rawStreamUrl === 'string' && /^https?:\/\//i.test(rawStreamUrl)
          ? `/api/stream?url=${encodeURIComponent(rawStreamUrl)}`
          : rawStreamUrl;

      let songSrc = streamUrl;

      console.log('[Player] resolved stream source:', songSrc);

      if (streamUrl && window.caches) {
        try {
          const cache = await caches.open('saved-songs-v1');
          let offline = await cache.match(streamUrl);
          if (!offline && rawStreamUrl && rawStreamUrl !== streamUrl) {
            offline = await cache.match(rawStreamUrl);
          }
          if (offline) {
            const blob = await offline.blob();
            if (objectUrlRef.current) {
              URL.revokeObjectURL(objectUrlRef.current);
              objectUrlRef.current = null;
            }
            objectUrlRef.current = URL.createObjectURL(blob);
            songSrc = objectUrlRef.current;
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

      const howl = new Howl({
        src: [songSrc],
        html5: true,
        volume: isMuted ? 0 : volume,
        onload: () => {
          setDuration(howl.duration());
        },
        onplay: () => {
          setIsPlaying(true);
          updateProgress();
          setupAnalyser();
        },
        onpause: () => {
          setIsPlaying(false);
          cancelAnimationFrame(animFrameRef.current);
        },
        onend: () => {
          cancelAnimationFrame(animFrameRef.current);
          if (repeat === 'one') {
            howl.seek(0);
            howl.play();
          } else {
            nextSong();
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
  }, [currentSong?.id, currentSong?.r2_url, currentSong?.stream_url]);

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
    if (analyserRef.current) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Try getting the Howler internal audio node
      const howlNode = howlRef.current._sounds[0]?._node;
      if (howlNode && !sourceRef.current) {
        const source = ctx.createMediaElementSource(howlNode);
        source.connect(analyser);
        analyser.connect(ctx.destination);
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
