import { randomBytes } from "node:crypto";
import { createServer } from "node:http";

const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPES = "user-read-currently-playing user-read-recently-played";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Optional local env file.
  }
}

const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

if (!clientId || !clientSecret) {
  console.error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET first.");
  process.exit(1);
}

const state = randomBytes(16).toString("hex");
const authorizeUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams(
  {
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state,
  },
)}`;

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1:8888");

  if (url.pathname !== "/callback") {
    response.writeHead(404).end("Not found");
    return;
  }

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  if (error || !code || returnedState !== state) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Spotify authorization failed. Check the terminal.");
    console.error("Spotify authorization failed:", error ?? "invalid callback");
    server.close();
    setTimeout(() => process.exit(1), 100);
    return;
  }

  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    Connection: "close",
  });
  response.end("<p>Spotify connected. You can close this tab.</p>");

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    const token = await tokenResponse.json();

    if (!tokenResponse.ok || !token.refresh_token) {
      throw new Error("Token exchange failed");
    }

    console.log("SPOTIFY_REFRESH_TOKEN:");
    console.log(token.refresh_token);
  } catch (exchangeError) {
    console.error(
      "Spotify token exchange failed:",
      exchangeError instanceof Error ? exchangeError.message : exchangeError,
    );
    server.close();
    setTimeout(() => process.exit(1), 100);
    return;
  }

  server.close();
  setTimeout(() => process.exit(0), 100);
});

server.on("error", (error) => {
  console.error("Local server failed:", error.message);
  process.exit(1);
});

server.listen(8888, "127.0.0.1", () => {
  console.log("Open this URL, then approve access:");
  console.log(authorizeUrl);
  console.log("Waiting on http://127.0.0.1:8888/callback ...");
});
