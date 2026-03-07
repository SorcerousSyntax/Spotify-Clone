const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const MUSIC_DIR = process.env.MUSIC_DIR || 'C:/music';
const BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001';

function sanitizeQuery(query) {
  return query.replace(/[\"'\\]/g, '').trim();
}

function downloadSong(query) {
  return new Promise((resolve, reject) => {
    const safeQuery = sanitizeQuery(query);
    const outputTemplate = path.join(MUSIC_DIR, '%(id)s.%(ext)s').replace(/\\/g, '/');

    // Download best available audio directly (no ffmpeg dependency required).
    const cmd = `yt-dlp "ytsearch1:${safeQuery} song official" -f bestaudio --no-playlist -o "${outputTemplate}" --print after_move:filepath --quiet`;

    console.log(`yt-dlp searching: ${safeQuery}`);

    exec(cmd, { timeout: 60000 }, (error, stdout) => {
      if (error) {
        console.error('yt-dlp error:', error.message);
        return reject(new Error('yt-dlp download failed'));
      }

      const filepath = stdout.trim();
      if (!filepath || !fs.existsSync(filepath)) {
        return reject(new Error('Downloaded file not found'));
      }

      const filename = path.basename(filepath);
      const streamUrl = `${BACKEND_PUBLIC_URL}/songs/${filename}`;

      console.log(`Downloaded: ${filename}`);
      resolve({
        id: filename.replace(path.extname(filename), ''),
        title: safeQuery,
        artist: 'Unknown Artist',
        albumArt: null,
        url: streamUrl,
        stream_url: streamUrl,
        r2_url: streamUrl,
        album_art_url: null,
        source: 'ytdlp',
        localFile: filepath,
      });
    });
  });
}

module.exports = { downloadSong };
