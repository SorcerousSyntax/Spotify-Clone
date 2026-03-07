import { useState, useEffect, useRef } from 'react';
import ColorThief from 'color-thief-browser';

const useColorExtract = (imageUrl) => {
  const [dominantColor, setDominantColor] = useState([29, 185, 84]);
  const [palette, setPalette] = useState([]);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const dominant = colorThief.getColor(img);
        const colors = colorThief.getPalette(img, 5);
        setDominantColor(dominant);
        setPalette(colors);
      } catch (e) {
        console.warn('Color extraction failed:', e.message);
        setDominantColor([29, 185, 84]);
      }
    };

    img.onerror = () => {
      setDominantColor([29, 185, 84]);
    };

    imgRef.current = img;
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
