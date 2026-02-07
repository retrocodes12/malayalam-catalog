'use strict';

const { fetchLatestMalayalamOttMovies, fetchMovieMeta } = require('./tmdb');

function getSkip(extra) {
  const raw = Number.parseInt(extra.skip, 10);
  return Number.isFinite(raw) ? raw : 0;
}

async function getCatalog({ type, id, extra }) {
  if (type !== 'movie' || id !== 'malayalam-ott-latest') {
    return { metas: [] };
  }

  const skip = getSkip(extra);
  const search = extra.search || '';
  const provider = extra.provider || '';

  const items = await fetchLatestMalayalamOttMovies({ skip, search, provider });
  const metas = items.map((item) => ({
    id: item.id,
    type: 'movie',
    name: item.name,
    poster: item.poster,
    background: item.background,
    description: item.description,
    releaseInfo: item.releaseInfo,
    genres: item.genres,
    imdbRating: item.imdbRating
  }));

  return { metas };
}

async function getMeta({ id }) {
  const meta = await fetchMovieMeta(id);
  return { meta };
}

module.exports = {
  getCatalog,
  getMeta
};
