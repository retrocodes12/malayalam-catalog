'use strict';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 10;

function getApiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error('TMDB_API_KEY is not set');
  }
  return key;
}

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value) {
  cache.set(key, { value, timestamp: Date.now() });
}

async function tmdbFetch(path, params = {}) {
  const key = getApiKey();
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', key);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    url.searchParams.set(k, String(v));
  });

  const cacheKey = url.toString();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`TMDB error ${response.status}: ${body}`);
  }
  const data = await response.json();
  cacheSet(cacheKey, data);
  return data;
}

function toImage(path, size) {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

function normalize(str) {
  return String(str || '').trim().toLowerCase();
}

function filterBySearch(items, search) {
  if (!search) return items;
  const q = normalize(search);
  if (!q) return items;
  return items.filter((item) => normalize(item.name).includes(q));
}

function getPageFromSkip(skip) {
  const safeSkip = Math.max(0, skip || 0);
  return Math.floor(safeSkip / 20) + 1;
}

function isAllProvider(value) {
  const normalized = normalize(value);
  return normalized === 'all' || normalized === 'any';
}

async function resolveProviderIds(providerParam) {
  if (!providerParam || isAllProvider(providerParam)) return null;

  const parts = providerParam
    .split(/[|,]/)
    .map((part) => normalize(part))
    .filter(Boolean);

  if (!parts.length) return null;
  if (parts.some(isAllProvider)) return null;

  const numericOnly = parts.every((part) => /^\d+$/.test(part));
  if (numericOnly) {
    return Array.from(new Set(parts)).join('|');
  }

  const data = await tmdbFetch('/watch/providers/movie', {
    watch_region: 'IN',
    language: 'en-US'
  });

  const providers = data.results || [];
  const nameToId = new Map();
  for (const provider of providers) {
    nameToId.set(normalize(provider.provider_name), provider.provider_id);
  }

  const aliases = new Map([
    ['prime', 'amazon prime video'],
    ['prime video', 'amazon prime video'],
    ['amazon prime', 'amazon prime video'],
    ['hotstar', 'disney+ hotstar'],
    ['disney hotstar', 'disney+ hotstar'],
    ['disney plus hotstar', 'disney+ hotstar'],
    ['jio cinema', 'jiocinema'],
    ['sonyliv', 'sony liv'],
    ['sun nxt', 'sunnxt'],
    ['zee5', 'zee5'],
    ['manorama max', 'manorama max'],
    ['aha', 'aha'],
    ['mx player', 'mx player'],
    ['lionsgate play', 'lionsgate play'],
    ['mubi', 'mubi']
  ]);

  const ids = new Set();
  for (const part of parts) {
    const alias = aliases.get(part) || part;
    const direct = nameToId.get(alias);
    if (direct) {
      ids.add(direct);
      continue;
    }

    for (const [name, id] of nameToId.entries()) {
      if (name.includes(alias)) {
        ids.add(id);
      }
    }
  }

  if (!ids.size) return '';
  return Array.from(ids).join('|');
}

function toMetaFromMovie(movie) {
  return {
    id: `tmdb:movie:${movie.id}`,
    type: 'movie',
    name: movie.title,
    poster: toImage(movie.poster_path, 'w500'),
    background: toImage(movie.backdrop_path, 'w1280'),
    description: movie.overview,
    releaseInfo: movie.release_date ? movie.release_date.slice(0, 4) : undefined,
    genres: movie.genres ? movie.genres.map((g) => g.name) : movie.genre_names,
    imdbRating: movie.vote_average ? Number(movie.vote_average).toFixed(1) : undefined
  };
}

async function fetchLatestMalayalamOttMovies({ skip, search, provider }) {
  const page = getPageFromSkip(skip);
  const today = new Date().toISOString().slice(0, 10);
  const providerIds = await resolveProviderIds(provider);
  if (provider && providerIds === '') return [];

  const data = await tmdbFetch('/discover/movie', {
    language: 'ml-IN',
    region: 'IN',
    with_original_language: 'ml',
    sort_by: 'primary_release_date.desc',
    'primary_release_date.lte': today,
    'watch_region': 'IN',
    'with_watch_monetization_types': 'flatrate',
    with_watch_providers: providerIds,
    page
  });

  const items = (data.results || []).map((movie) => ({
    id: `tmdb:movie:${movie.id}`,
    name: movie.title,
    poster: toImage(movie.poster_path, 'w500'),
    background: toImage(movie.backdrop_path, 'w1280'),
    description: movie.overview,
    releaseInfo: movie.release_date ? movie.release_date.slice(0, 4) : undefined,
    genres: movie.genre_ids,
    imdbRating: movie.vote_average ? Number(movie.vote_average).toFixed(1) : undefined
  }));

  const filtered = filterBySearch(items, search);
  return filtered;
}

async function fetchMovieMeta(id) {
  if (!id || !id.startsWith('tmdb:movie:')) return null;
  const movieId = id.split(':')[2];
  if (!movieId) return null;

  const data = await tmdbFetch(`/movie/${movieId}`, {
    language: 'ml-IN',
    append_to_response: 'credits,videos,watch/providers'
  });

  const credits = data.credits || {};
  const cast = (credits.cast || []).slice(0, 10).map((person) => person.name);
  const director = (credits.crew || []).find((member) => member.job === 'Director');
  const videos = (data.videos && data.videos.results) || [];
  const trailer = videos.find((vid) => vid.type === 'Trailer' && vid.site === 'YouTube');

  const meta = toMetaFromMovie({
    id: data.id,
    title: data.title,
    poster_path: data.poster_path,
    backdrop_path: data.backdrop_path,
    overview: data.overview,
    release_date: data.release_date,
    genres: data.genres,
    vote_average: data.vote_average
  });

  return {
    ...meta,
    runtime: data.runtime,
    country: (data.production_countries || []).map((c) => c.name),
    language: (data.spoken_languages || []).map((l) => l.english_name || l.name),
    cast,
    director: director ? director.name : undefined,
    trailers: trailer
      ? [{
          source: trailer.key,
          type: 'Trailer'
        }]
      : undefined
  };
}

module.exports = {
  fetchLatestMalayalamOttMovies,
  fetchMovieMeta
};
