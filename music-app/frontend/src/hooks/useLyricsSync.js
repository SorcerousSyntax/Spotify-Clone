import { useState, useEffect, useCallback } from 'react';
import usePlayerStore from '../store/playerStore';

const useLyricsSync = (lyrics = []) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const progress = usePlayerStore((s) => s.progress);

  useEffect(() => {
    if (!lyrics || lyrics.length === 0) {
      setCurrentLineIndex(-1);
      return;
    }

    // Find the current line based on progress
    let index = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (progress >= lyrics[i].time) {
        index = i;
        break;
      }
    }
    setCurrentLineIndex(index);
  }, [progress, lyrics]);

  const getLineStatus = useCallback(
    (index) => {
      if (index === currentLineIndex) return 'active';
      if (index < currentLineIndex) return 'past';
      return 'future';
    },
    [currentLineIndex]
  );

  return {
    currentLineIndex,
    getLineStatus,
    currentLine: lyrics[currentLineIndex] || null,
    nextLine: lyrics[currentLineIndex + 1] || null,
    prevLine: lyrics[currentLineIndex - 1] || null,
  };
};

export default useLyricsSync;
