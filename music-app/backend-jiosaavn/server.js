require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const songsRouter = require('./routes/songs');

const app = express();
const PORT = process.env.PORT || 3001;
const MUSIC_DIR = process.env.MUSIC_DIR || 'C:/music';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

if (!fs.existsSync(MUSIC_DIR)) {
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.use('/songs', express.static(MUSIC_DIR));
app.use('/api', songsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Raabta backend running' });
});

app.listen(PORT, () => {
  console.log(`Raabta backend running on http://localhost:${PORT}`);
  console.log(`Music directory: ${MUSIC_DIR}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
});
