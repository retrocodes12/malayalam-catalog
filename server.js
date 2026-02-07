'use strict';

const http = require('http');
const handler = require('./api/index');

const port = process.env.PORT || 7000;

const server = http.createServer((req, res) => {
  handler(req, res);
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Malayalam addon running at http://localhost:${port}/manifest.json`);
});
