import { connection } from "next/server";

import { getSpotify } from "@/lib/spotify";

export async function GET() {
  await connection();
  const data = await getSpotify();

  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
