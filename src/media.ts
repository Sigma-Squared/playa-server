import { join } from "@std/path";
import { loadConfig } from "./config.ts";

let cachedExtensions: string[] | null = null;

/**
 * Recursively collects all supported media files under the given directory.
 */
export async function findMediaFiles(root: string): Promise<string[]> {
  const matches: string[] = [];
  const supportedExtensions = await getSupportedExtensions();
  await collect(root, matches, supportedExtensions);
  return matches;
}

async function collect(
  currentDir: string,
  matches: string[],
  supportedExtensions: string[],
): Promise<void> {
  for await (const entry of Deno.readDir(currentDir)) {
    const entryPath = join(currentDir, entry.name);
    if (entry.isDirectory) {
      await collect(entryPath, matches, supportedExtensions);
      continue;
    }

    if (entry.isFile && hasSupportedExtension(entry.name, supportedExtensions)) {
      matches.push(entryPath);
    }
  }
}

async function getSupportedExtensions(): Promise<string[]> {
  if (cachedExtensions) {
    return cachedExtensions;
  }

  const config = await loadConfig();
  cachedExtensions = config.supported_extensions;
  return cachedExtensions;
}

function hasSupportedExtension(filename: string, supportedExtensions: string[]): boolean {
  const lower = filename.toLowerCase();
  return supportedExtensions.some((ext) => lower.endsWith(ext));
}
