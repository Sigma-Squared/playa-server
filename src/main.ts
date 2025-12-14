import { Hono } from "@hono/hono";
import type { Context, Next } from "@hono/hono";
import { join } from "@std/path";
import { serveFile } from "@std/http/file-server";
import { loadConfig } from "./config.ts";
import { type Configuration, createOkResponse } from "./model.ts";

const config = await loadConfig();
const PORT = config.port;
const VERSION = config.version;
const MEDIA_ROOT = join(Deno.cwd(), config.media_root);

const app = new Hono();

app.use("*", async (context: Context, next: Next) => {
  console.log(`${context.req.method} ${context.req.url}`);
  await next();
});

app.get("/", (context: Context) => {
  return context.json({ status: { code: 2, message: "Ok" }, data: "" });
});

const api = app.route("/api/playa/v2");

api.get("/version", (context: Context) => {
  return context.json(createOkResponse(VERSION));
});

api.get("/config", (context: Context) => {
  return context.json(createOkResponse<Configuration>(config));
});

api.get("/videos", (context: Context) => {
  const query = context.req.query();
  const pageIndex = parseQueryNumber(query["page-index"], 0);
  const pageSize = parseQueryNumber(query["page-size"], 12);
  const order = query["order"] ?? "release_date";
  const direction = normalizeDirection(query["direction"]);

  return context.json(createOkResponse({
    page_index: pageIndex,
    page_size: pageSize,
    order,
    direction,
  }));
});

api.get("/videos/:id/video.mp4", async (context: Context) => {
  const id = context.req.param("id");
  const videoPath = join(MEDIA_ROOT, id, "video.mp4");

  try {
    const fileResponse = await serveFile(context.req.raw, videoPath);
    return context.newResponse(fileResponse.body, {
      status: fileResponse.status,
      headers: fileResponse.headers,
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return context.json({
        status: { code: 404, message: "Video not found." },
        data: null,
      }, 404);
    }
    throw error;
  }
});

function parseQueryNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDirection(value: string | undefined): "asc" | "desc" {
  if (!value) {
    return "desc";
  }

  const lower = value.toLowerCase();
  return lower === "asc" ? "asc" : "desc";
}

console.log(`HTTP server listening on http://localhost:${PORT}`);
Deno.serve({ port: PORT }, app.fetch);
