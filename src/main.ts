import { Hono } from "@hono";
import type { Context, Next } from "@hono";
import { findMediaFiles } from "./media.ts";
import { type Configuration, createOkResponse } from "./model.ts";

const PORT = Number(Deno.env.get("PORT")) || 80;
const VERSION = Deno.env.get("PLAYA_VERSION") ?? "1.3.0";
const SITE_NAME = "Deno-Play'A";

const app = new Hono();

app.use("*", async (context: Context, next: Next) => {
  console.log(`${context.req.method} ${context.req.url}`);
  await next();
});

app.get("/", (context: Context) => {
  return context.json({ status: { code: 2, message: "Ok" }, data: "" });
});

app.get("/api/playa/v2/version", (context: Context) => {
  return context.json(createOkResponse(VERSION));
});

app.get("/api/playa/v2/config", (context: Context) => {
  return context.json(createOkResponse<Configuration>({
    site_name: SITE_NAME,
    site_logo: "https://picsum.photos/256/256",
    auth: false,
    actors: false,
    categories: false,
    categories_groups: false,
    studios: false,
    scripts: false,
    masks: false,
    analytics: false,
  }));
});

console.log(`HTTP server listening on http://localhost:${PORT}`);
Deno.serve({ port: PORT }, app.fetch);
