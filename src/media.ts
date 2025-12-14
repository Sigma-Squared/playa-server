import { walk } from "@std/fs";
import { basename } from "@std/path";
import { loadConfig } from "./config.ts";
import { Video } from "./model.ts";

export async function findMediaFiles(root: string): Promise<Map<string, Video>> {
  const supportedExtensions = (await loadConfig()).supported_extensions;
  return walkForMedia(root, supportedExtensions);
}

async function walkForMedia(
  root: string,
  extensions: string[],
): Promise<Map<string, Video>> {
  const matches = new Map<string, Video>();
  const normalized = extensions.map((ext) => ext.toLowerCase());

  try {
    for await (const entry of walk(root, { includeDirs: false, followSymlinks: false })) {
      if (!entry.isFile) {
        continue;
      }

      const lowerPath = entry.path.toLowerCase();
      if (normalized.some((ext) => lowerPath.endsWith(ext))) {
        const { path } = entry;
        matches.set(await pathToHash(path), { path, filename: basename(entry.path) });
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return matches;
    }
    throw error;
  }

  return matches;
}

async function pathToHash(path: string): Promise<string> {
  const data = new TextEncoder().encode(path);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
