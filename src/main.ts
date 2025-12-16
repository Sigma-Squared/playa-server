import { Hono } from "@hono/hono";
import type { Context, Next } from "@hono/hono";
import { join } from "@std/path";
import { serveFile } from "@std/http/file-server";
import { loadConfig } from "./config.ts";
import {
  createOkResponse,
  Page,
  type PlayaConfiguration,
  VideoListView,
  videosQuerySchema,
  VideoView,
} from "./model.ts";
import { findMediaFiles } from "./media.ts";

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

function paginate<T>(items: T[], pageSize: number, pageIndex: number): T[] {
  if (pageSize <= 0 || pageIndex < 0) {
    return [];
  }

  const start = pageIndex * pageSize;
  return items.slice(start, start + pageSize);
}

api.get("/videos", (context: Context) => {
  const parsed = videosQuerySchema.parse(context.req.query());
  const {
    "page-index": pageIndex,
    "page-size": pageSize,
    order,
    direction,
  } = parsed;

  const item_total = files.size;
  const page_total = Math.ceil(item_total / pageSize);

  return context.json(createOkResponse<Page<VideoListView>>({
    page_index: pageIndex,
    page_size: pageSize,
    page_total,
    item_total,
    content: paginate(videoList, pageSize, pageIndex),
  }));
});

api.get("/video/:id", (context: Context) => {
  const id = context.req.param("id");
  const video = files.get(id);
  if (!video) {
    return context.json({
      status: { code: 404, message: "Video not found." },
      data: null,
    }, 404);
  }

  return context.json(createOkResponse<VideoView>({
    id,
    title: video.filename,
    subtitle: "subtitle",
    description: "This is a detailed description of the video.",
    prevew_image: "",
    release_date: Date.now(),
    views: 0,
    details: [{
      type: "full",
      duration_seconds: video.duration_seconds,
      links: [{
        is_stream: true,
        is_download: true,
        quality_name: "4K",
        quality_order: 45,
        stereo: "LR",
        projection: "180",
        url: new URL(`/content/${id}`, context.req.url).toString(),
      }],
    }],
  }));
});

const files = await findMediaFiles("/Users/chamu/Downloads");
const videoList: VideoListView[] = Array.from(files, ([key, video]) => ({
  id: key,
  title: video.filename,
  prevew_image: "",
  details: [{
    type: "full",
    duration_seconds: video.duration_seconds,
  }],
}));
console.log(files);

app.get("/content/:id", (context: Context) => {
  const id = context.req.param("id");

  try {
    const video = files.get(id);
    if (!video) {
      throw new Deno.errors.NotFound();
    }
    return serveFile(context.req.raw, video.path);
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

app.route("/api/playa/v2", api);

Deno.serve({ port: PORT }, app.fetch);
