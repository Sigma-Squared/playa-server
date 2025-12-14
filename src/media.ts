import { join } from "@std/path/mod.ts";
import { parse } from "@std/yaml/mod.ts";

const DEFAULT_CONFIG_PATH = "/config/media.yml";

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

  const configText = await readConfigFile();
  const parsed = parse(configText);
  const extensions = extractExtensions(parsed);
  cachedExtensions = extensions;
  return cachedExtensions;
}

async function readConfigFile(): Promise<string> {
  const candidatePaths = [
    DEFAULT_CONFIG_PATH,
    join(Deno.cwd(), "config", "media.yml"),
  ];

  for (const path of candidatePaths) {
    try {
      return await Deno.readTextFile(path);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Unable to load media config. Checked: ${candidatePaths.join(", ")}`,
  );
}

function extractExtensions(doc: unknown): string[] {
  if (!doc || typeof doc !== "object") {
    throw new Error("Media config must be an object.");
  }

  const raw = (doc as Record<string, unknown>).supported_extensions;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("Media config requires a non-empty supported_extensions list.");
  }

  return raw.map((ext) => String(ext).toLowerCase());
}

function hasSupportedExtension(filename: string, supportedExtensions: string[]): boolean {
  const lower = filename.toLowerCase();
  return supportedExtensions.some((ext) => lower.endsWith(ext));
}
