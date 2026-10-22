# Spotify setup

The About card reads the three server-only variables in `.env.example`. Missing
credentials or a failed request render the placeholder track with `NOT SYNCED`.

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Add `http://127.0.0.1:8888/callback` as a redirect URI. Copy the client ID and secret.
3. Copy `.env.example` to `.env.local` and fill in the client ID and secret.
4. Run `pnpm spotify:token`. Open the printed URL and approve access.
5. Copy the printed refresh token into `SPOTIFY_REFRESH_TOKEN` in `.env.local`.
6. Restart the dev server.

```dotenv
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
```

The token script listens only on `127.0.0.1:8888`, uses the
`user-read-currently-playing` and `user-read-recently-played` scopes, and prints
the refresh token to the terminal. It never writes credentials to disk.

`.env*` is ignored by git except `.env.example`. Do not use a `NEXT_PUBLIC_`
prefix. The API route always returns JSON, caches for 30 seconds, and falls back
to the track in `siteConfig.spotify.fallback` when credentials are absent.
