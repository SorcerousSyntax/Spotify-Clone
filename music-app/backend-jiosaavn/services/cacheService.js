const NodeCache = require('node-cache');

const searchCache = new NodeCache({ stdTTL: 3600 });
const songCache = new NodeCache({ stdTTL: 86400 });

function getCachedSearch(query) {
  return searchCache.get(query.toLowerCase().trim());
}

function setCachedSearch(query, results) {
  searchCache.set(query.toLowerCase().trim(), results);
}

function getCachedSong(id) {
  return songCache.get(id);
}

function setCachedSong(id, song) {
  songCache.set(id, song);
}

module.exports = {
  getCachedSearch,
  setCachedSearch,
  getCachedSong,
  setCachedSong,
};
