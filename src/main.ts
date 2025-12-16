import { Hono } from "@hono/hono";
import type { Context, Next } from "@hono/hono";
import { ensureDir, exists } from "@std/fs";
import { dirname } from "@std/path";
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
import { createThumbnail, findMediaFiles } from "./media.ts";
import { dockerifyPath, relativeToAbsoluteUrl } from "./utils.ts";

const VERSION = "1.0.0";

const config = await loadConfig();

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
  return context.json(createOkResponse(config.playa_client_version));
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
    content: paginate(videoList, pageSize, pageIndex).map((vw) => ({
      ...vw,
      preview_image: relativeToAbsoluteUrl(vw.preview_image, context.req),
    })),
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
    preview_image: relativeToAbsoluteUrl(`/content/${id}/thumbnail`, context.req),
    release_date: Date.now(),
    views: 0,
    details: [{
      type: "full",
      duration_seconds: video.durationSeconds,
      links: [{
        is_stream: true,
        is_download: true,
        quality_name: "4K",
        quality_order: 45,
        stereo: "LR",
        projection: "180",
        url: relativeToAbsoluteUrl(`/content/${id}`, context.req),
      }],
    }],
  }));
});

const files = await findMediaFiles(dockerifyPath(config.media_root));
const videoList: VideoListView[] = Array.from(files, ([key, video]) => ({
  id: key,
  title: video.filename,
  preview_image: `/content/${key}/thumbnail`,
  details: [{
    type: "full",
    duration_seconds: video.durationSeconds,
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
      return notFoundResponse(context);
    }
    throw error;
  }
});

app.get("/content/:id/thumbnail", async (context: Context) => {
  const id = context.req.param("id");
  try {
    const video = files.get(id);
    if (!video) {
      throw new Deno.errors.NotFound();
    }

    const thumbnailFile = dockerifyPath(`/appdata/thumbnails/${id}.jpg`);
    if (!await exists(thumbnailFile)) {
      await ensureDir(dirname(thumbnailFile));
      await createThumbnail(video, thumbnailFile);
    }

    return serveFile(context.req.raw, thumbnailFile);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return notFoundResponse(context);
    }
    throw error;
  }
});

function notFoundResponse(context: Context) {
  return context.json({
    status: { code: 404, message: "Not Found." },
    data: null,
  }, 404);
}

app.route("/api/playa/v2", api);

console.log("Deno Play'A Server version", VERSION);
Deno.serve({ port: config.port }, app.fetch);
