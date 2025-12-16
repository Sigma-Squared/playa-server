import { HonoRequest } from "@hono/hono";

export function relativeToAbsoluteUrl(relativePath: string, request: HonoRequest): string {
    return new URL(relativePath, request.url).toString();
}