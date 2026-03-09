import { useState, useEffect, useRef } from 'react';
import ColorThief from 'color-thief-browser';

const useColorExtract = (imageUrl) => {
  const [dominantColor, setDominantColor] = useState([29, 185, 84]);
  const [palette, setPalette] = useState([]);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imageUrl) return;

    let cancelled = false;
    let blobUrl = null;

    const tryExtract = (src, withCors) => {
      const img = new Image();
      if (withCors) img.crossOrigin = 'Anonymous';
      img.onload = () => {
        if (cancelled) return;
        try {
          const ct = new ColorThief();
          setDominantColor(ct.getColor(img));
          setPalette(ct.getPalette(img, 5));
        } catch (_) {
          // canvas tainted or extraction failed — keep existing color
        }
        if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
      };
      img.onerror = () => {
        if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
      };
      img.src = src;
      imgRef.current = img;
    };

    // Primary: fetch → blob URL (same-origin, no CORS canvas taint)
    fetch(imageUrl)
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelled) return;
        blobUrl = URL.createObjectURL(blob);
        tryExtract(blobUrl, false);
      })
      .catch(() => {
        // Fallback: direct load with crossOrigin header
        if (!cancelled) tryExtract(imageUrl, true);
      });

    return () => {
      cancelled = true;
      if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
    };
  }, [imageUrl]);

  const rgbString = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
  const rgbaString = (alpha) =>
    `rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, ${alpha})`;

  return {
    dominantColor,
    palette,
    rgbString,
    rgbaString,
  };
};

export default useColorExtract;
