import { Hono } from "@hono";
import type { Context, Next } from "@hono";
import { loadConfig } from "./config.ts";
import { type Configuration, createOkResponse } from "./model.ts";

const config = await loadConfig();
const PORT = config.port;
const VERSION = config.version;

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

console.log(`HTTP server listening on http://localhost:${PORT}`);
Deno.serve({ port: PORT }, app.fetch);
