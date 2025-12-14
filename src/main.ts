import { findMediaFiles } from "./media.ts";

const PORT = Number(Deno.env.get("PORT")) || 4236;

const handler = async (request: Request): Response => {
  const { method, url } = request;
  const body = JSON.stringify({
    files: await findMediaFiles("/Volumes/media/funstuff/VR/"),
  });

  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
};

console.log(`HTTP server listening on http://localhost:${PORT}`);
Deno.serve({ port: PORT }, handler);
