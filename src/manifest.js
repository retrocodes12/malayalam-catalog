'use strict';

const MANIFEST = {
  id: 'org.malayalam.catalog',
  version: '1.1.0',
  name: 'Malayalam OTT Catalog',
  description: 'Latest Malayalam movies available on OTT (via TMDB).',
  types: ['movie'],
  resources: [
    {
      name: 'catalog',
      types: ['movie'],
      idPrefixes: ['tmdb:movie:']
    },
    {
      name: 'meta',
      types: ['movie'],
      idPrefixes: ['tmdb:movie:']
    }
  ],
  catalogs: [
    {
      type: 'movie',
      id: 'malayalam-ott-latest',
      name: 'Latest Malayalam OTT',
      extra: [
        { name: 'search', isRequired: false },
        { name: 'provider', isRequired: false },
        { name: 'skip', isRequired: false }
      ]
    }
  ],
  posterShape: 'poster'
};

module.exports = {
  MANIFEST
};
