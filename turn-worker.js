const GAME_ORIGIN = "https://quang0203.github.io";

function corsHeaders(origin) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  });
  if (origin === GAME_ORIGIN) headers.set("Access-Control-Allow-Origin", GAME_ORIGIN);
  return headers;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (origin !== GAME_ORIGIN) {
      return new Response("Forbidden", { status: 403, headers });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers });
    }
    if (new URL(request.url).pathname !== "/ice") {
      return new Response("Not found", { status: 404, headers });
    }
    if (!env.METERED_APP || !env.METERED_API_KEY) {
      return new Response("TURN service is not configured", { status: 503, headers });
    }

    const upstreamUrl = new URL(
      `https://${env.METERED_APP}.metered.live/api/v1/turn/credentials`,
    );
    upstreamUrl.searchParams.set("apiKey", env.METERED_API_KEY);

    try {
      const upstream = await fetch(upstreamUrl, {
        headers: { Accept: "application/json" },
        cf: { cacheTtl: 0, cacheEverything: false },
      });
      const body = await upstream.text();
      headers.set(
        "Content-Type",
        upstream.headers.get("Content-Type") || "application/json",
      );
      return new Response(body, { status: upstream.status, headers });
    } catch {
      return new Response("Unable to retrieve TURN credentials", {
        status: 502,
        headers,
      });
    }
  },
};
