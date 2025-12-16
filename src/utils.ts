import { HonoRequest } from "@hono/hono";
import { join } from "@std/path";

export function relativeToAbsoluteUrl(relativePath: string, request: HonoRequest): string {
  return new URL(relativePath, request.url).toString();
}

export function dockerifyPath(path: string): string {
  if (Deno.env.get("DEVELOPMENT")) {
    return join(".", path);
  }
  return path;
}
