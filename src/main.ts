import { Hono } from "@hono/hono";
import type { Context, Next } from "@hono/hono";
import { join } from "@std/path";
import { serveFile } from "@std/http/file-server";
import { loadConfig } from "./config.ts";
import { createOkResponse, type PlayaConfiguration, videosQuerySchema } from "./model.ts";

const config = await loadConfig();
const PORT = config.port;
const VERSION = config.version;
const MEDIA_ROOT = join(Deno.cwd(), config.media_root);

const app = new Hono();
const api = new Hono();

app.use("*", async (context: Context, next: Next) => {
  console.log(`${context.req.method} ${context.req.url}`);
  await next();
});

app.get("/", (context: Context) => {
  return context.json({ status: { code: 2, message: "Ok" }, data: "" });
});

api.get("/version", (context: Context) => {
  return context.json(createOkResponse(VERSION));
});

api.get("/config", (context: Context) => {
  return context.json(createOkResponse<PlayaConfiguration>(config.playa_config));
});

api.get("/videos", (context: Context) => {
  const parsed = videosQuerySchema.parse(context.req.query());
  const pageIndex = parsed["page-index"];
  const pageSize = parsed["page-size"];
  const order = parsed.order;
  const direction = parsed.direction;

  return context.json(createOkResponse({
    page_index: pageIndex,
    page_size: pageSize,
    order,
    direction,
  }));
});

api.get("/videos/:id/video.mp4", (context: Context) => {
  const id = context.req.param("id");
  console.log(`Request for video ID: ${id}`);
  const videoPath = join("/Users/chamu/Downloads", "jasminx tennis strip.mp4");

  try {
    console.log(`Serving video file from path: ${videoPath}`);
    return serveFile(context.req.raw, videoPath);
  } catch (error) {
    console.error(error);
    if (error instanceof Deno.errors.NotFound) {
      return context.json({
        status: { code: 404, message: "Video not found." },
        data: null,
      }, 404);
    }
    throw error;
  }
});

app.route("/api/playa/v2", api);

console.log(`HTTP server listening on http://localhost:${PORT}`);
Deno.serve({ port: PORT }, app.fetch);
