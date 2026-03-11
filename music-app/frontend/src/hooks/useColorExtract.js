import { useState, useEffect, useRef } from 'react';
import ColorThief from 'color-thief-browser';

const useColorExtract = (imageUrl) => {
  const [dominantColor, setDominantColor] = useState([139, 92, 246]);
  const [palette, setPalette] = useState([]);
  const imgRef = useRef(null);

  useEffect(() => {
    // Reset to default immediately when song/URL changes so stale colour never lingers
    setDominantColor([139, 92, 246]);
    setPalette([]);

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

    // data: URLs are already same-origin — extract directly
    if (imageUrl.startsWith('data:')) {
      tryExtract(imageUrl, false);
      return () => { cancelled = true; };
    }

    // For external CDN URLs (e.g. JioSaavn) route through the backend proxy
    // so the browser receives a same-origin blob — no canvas CORS taint
    const proxyUrl = `/api/art-proxy?url=${encodeURIComponent(imageUrl)}`;
    fetch(proxyUrl)
      .then((r) => {
        if (!r.ok) throw new Error('proxy failed');
        return r.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        blobUrl = URL.createObjectURL(blob);
        tryExtract(blobUrl, false);
      })
      .catch(() => {
        // Fallback: direct fetch → blob (works if CDN sends CORS headers)
        if (cancelled) return;
        fetch(imageUrl)
          .then((r) => r.blob())
          .then((blob) => {
            if (cancelled) return;
            blobUrl = URL.createObjectURL(blob);
            tryExtract(blobUrl, false);
          })
          .catch(() => {
            if (!cancelled) tryExtract(imageUrl, true);
          });
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
