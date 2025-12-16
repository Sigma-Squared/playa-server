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
import { createThumbnail, findMediaFiles, getVideoMetadata } from "./media.ts";
import { dockerifyPath, paginate, relativeToAbsoluteUrl } from "./utils.ts";

const VERSION = "1.0.0";

const config = await loadConfig();

const files = await findMediaFiles(dockerifyPath(config.media_root));
const videoList: VideoListView[] = Array.from(files, ([id, video]) => ({
  id,
  title: video.filename,
  preview_image: `/content/${id}/thumbnail`,
  details: [{
    type: "full",
    duration_seconds: video.durationSeconds,
  }],
}));
console.log(`[main] Loaded ${videoList.length} files from ${config.media_root}`);

const app = new Hono();
const api = new Hono();

if (Deno.env.get("DEVELOPMENT")) {
  app.use("*", async (context: Context, next: Next) => {
    console.log(`[main] ${context.req.method} ${context.req.url}`);
    await next();
  });
}

app.get("/", (context: Context) => {
  return context.json({ status: { code: 2, message: "Ok" }, data: "" });
});

api.get("/version", (context: Context) => {
  return context.json(createOkResponse(config.playa_client_version));
});

api.get("/config", (context: Context) => {
  return context.json(createOkResponse<PlayaConfiguration>(config.playa_config));
});

api.get("/videos", (context: Context) => {
  const parsed = videosQuerySchema.parse(context.req.query());
  const {
    "page-index": pageIndex,
    "page-size": pageSize,
  } = parsed;

  const itemTotal = files.size;
  const pageTotal = Math.ceil(itemTotal / pageSize);

  return context.json(createOkResponse<Page<VideoListView>>({
    page_index: pageIndex,
    page_size: pageSize,
    page_total: pageTotal,
    item_total: itemTotal,
    content: paginate(videoList, pageSize, pageIndex).map((vw) => ({
      ...vw,
      preview_image: relativeToAbsoluteUrl(vw.preview_image, context.req),
    })),
  }));
});

api.get("/video/:id", async (context: Context) => {
  const id = context.req.param("id");
  const video = files.get(id);
  if (!video) {
    return notFoundResponse(context);
  }

  const {
    title,
    subtitle,
    description,
    previewImage,
    releaseDate,
    views,
  } = await getVideoMetadata(id, video);

  return context.json(createOkResponse<VideoView>({
    id,
    title,
    subtitle,
    description,
    preview_image: relativeToAbsoluteUrl(previewImage, context.req),
    release_date: releaseDate.getTime(),
    views,
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
