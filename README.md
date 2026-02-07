# Malayalam Catalog Addon for Stremio

This is a minimal Stremio addon that serves the latest Malayalam movies available on OTT platforms using TMDB data and is ready for deployment on Vercel.

## Local dev

```bash
npm run dev
```

Open:

```
http://localhost:7000/manifest.json
```

## TMDB API key

Set `TMDB_API_KEY` in your environment before running locally:

```bash
export TMDB_API_KEY=your_key_here
```

In Vercel, add `TMDB_API_KEY` as a project environment variable.

## Deploy on Vercel

1. Push this repo to GitHub.
2. Create a new Vercel project and import the repo.
3. Deploy with default settings.

After deployment, your addon manifest will be at:

```
https://<your-vercel-domain>/manifest.json
```

Add it in Stremio via **Add Addon > Community Addons > Custom**.

## Provider filter

By default, the addon includes **all** OTT providers available in India.  
You can optionally filter by a TMDB provider id or provider name using the `provider` extra.

Examples:

```
/catalog/movie/malayalam-ott-latest.json?provider=8
```

```
/catalog/movie/malayalam-ott-latest.json?provider=netflix,prime,hotstar
```

Use `provider=all` (or omit the parameter) to include every provider.
