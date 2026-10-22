import "server-only";

import { siteConfig, type SpotifyTrack } from "@/config/site";

export type SpotifyResponse = SpotifyTrack & {
  ok: boolean;
  isPlaying: boolean;
};

type SpotifyImage = {
  url?: string;
};

type SpotifyArtist = {
  name?: string;
};

type SpotifyItem = {
  type?: string;
  name?: string;
  artists?: SpotifyArtist[];
  album?: {
    images?: SpotifyImage[];
  };
  external_urls?: {
    spotify?: string;
  };
};

type CurrentlyPlaying = {
  is_playing?: boolean;
  currently_playing_type?: string;
  item?: SpotifyItem | null;
};

type RecentlyPlayed = {
  items?: Array<{
    track?: SpotifyItem | null;
  }>;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
};

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_URL = "https://api.spotify.com/v1";

let tokenCache: { token: string; expiresAt: number } | null = null;

function fallbackResponse(): SpotifyResponse {
  return {
    ok: false,
    isPlaying: false,
    ...siteConfig.spotify.fallback,
  };
}

function normalize(item: SpotifyItem, isPlaying: boolean): SpotifyResponse | null {
  const url = item.external_urls?.spotify;
  const title = item.name;
  const artists = (item.artists ?? [])
    .map((artist) => artist.name)
    .filter((name): name is string => Boolean(name));

  if (!url || !title || artists.length === 0) return null;

  return {
    ok: true,
    isPlaying,
    title,
    artists,
    albumArt: item.album?.images?.[0]?.url ?? null,
    url,
  };
}

async function getAccessToken({
  clientId,
  clientSecret,
  refreshToken,
}: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}) {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Spotify token request failed");

  const data = (await response.json()) as TokenResponse;
  if (!data.access_token) throw new Error("Spotify token response was empty");

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return data.access_token;
}

async function getCurrentTrack(token: string) {
  const response = await fetch(`${API_URL}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 204) return null;
  if (!response.ok) throw new Error("Spotify current track request failed");

  const data = (await response.json()) as CurrentlyPlaying;
  const item = data.item;
  const isTrack =
    data.currently_playing_type === "track" && item?.type === "track";

  if (!data.is_playing || !isTrack || !item) return null;

  return normalize(item, true);
}

async function getRecentTrack(token: string) {
  const response = await fetch(
    `${API_URL}/me/player/recently-played?limit=1`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) throw new Error("Spotify recent track request failed");

  const data = (await response.json()) as RecentlyPlayed;
  const item = data.items?.[0]?.track;

  if (!item) return null;

  return normalize(item, false);
}

export async function getSpotify(): Promise<SpotifyResponse> {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    return fallbackResponse();
  }

  try {
    const token = await getAccessToken({
      clientId,
      clientSecret,
      refreshToken,
    });

    const current = await getCurrentTrack(token);
    if (current) return current;

    const recent = await getRecentTrack(token);
    return recent ?? fallbackResponse();
  } catch {
    return fallbackResponse();
  }
}
