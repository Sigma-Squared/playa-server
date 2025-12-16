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
        matches.set(await pathToHash(path), {
          path,
          filename: basename(entry.path),
          durationSeconds: await getDuration(path),
        });
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

async function getDuration(path: string): Promise<number> {
  const process = new Deno.Command("ffprobe", {
    args: [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      path,
    ],
    stdout: "piped",
  });

  const { success, stdout } = await process.output();
  if (!success) return 0;
  return Math.floor(Number(new TextDecoder().decode(stdout).trim()));
}

export async function createThumbnail(
  video: Video,
  outputPath: string,
): Promise<boolean> {
  const inputPath = video.path;
  const midpointSeconds = video.durationSeconds > 0 ? (video.durationSeconds / 2).toString() : "0";
  const { success, stderr } = await new Deno.Command("ffmpeg", {
    args: [
      "-y",
      "-ss",
      midpointSeconds,
      "-i",
      inputPath,
      "-vf",
      "crop=iw/2:ih:0:0,crop=iw*0.50:ih*0.50:iw*0.25:ih*0.25",
      "-frames:v",
      "1",
      outputPath,
    ],
    stdout: "piped",
    stderr: "piped",
  }).output();
  if (!success) {
    console.error("[media.createThumbnail FAILED", new TextDecoder().decode(stderr));
  }
  return success;
}
