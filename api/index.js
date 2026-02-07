'use strict';

const { URL } = require('url');
const { MANIFEST } = require('../src/manifest');
const { getCatalog, getMeta } = require('../src/handlers');

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.end(JSON.stringify(payload));
}

function parseExtraParams(url) {
  const extra = {};
  for (const [key, value] of url.searchParams.entries()) {
    extra[key] = value;
  }
  return extra;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.end();
  }

  const originalUrl = req.headers['x-vercel-original-url'] || req.url;
  const url = new URL(originalUrl, 'http://localhost');
  const path = url.pathname;

  if (path === '/' || path === '/manifest.json') {
    return sendJson(res, 200, MANIFEST);
  }

  const catalogMatch = path.match(/^\/catalog\/([^/]+)\/([^/]+)\.json$/);
  if (catalogMatch) {
    const [, type, id] = catalogMatch;
    const extra = parseExtraParams(url);
    try {
      const payload = await getCatalog({ type, id, extra });
      return sendJson(res, 200, payload);
    } catch (error) {
      return sendJson(res, 500, { error: error.message });
    }
  }

  const metaMatch = path.match(/^\/meta\/([^/]+)\/([^/]+)\.json$/);
  if (metaMatch) {
    const [, type, id] = metaMatch;
    try {
      const payload = await getMeta({ type, id });
      return sendJson(res, 200, payload);
    } catch (error) {
      return sendJson(res, 500, { error: error.message });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
};
