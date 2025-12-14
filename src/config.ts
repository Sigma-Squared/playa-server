import { join } from "@std/path/mod.ts";
import { parse } from "@std/yaml/mod.ts";
import type { Configuration } from "./model.ts";

const CONFIG_LOCATIONS = [
  "/config/config.yml",
  join(Deno.cwd(), "config", "config.yml"),
];

export type AppConfig = Configuration & {
  port: number;
  version: string;
  supported_extensions: string[];
};

let cachedConfig: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const text = await readConfigText();
  const parsed = parse(text);
  const normalized = normalizeConfig(parsed);
  cachedConfig = normalized;
  return cachedConfig;
}

async function readConfigText(): Promise<string> {
  for (const path of CONFIG_LOCATIONS) {
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
    `Unable to load config. Checked: ${CONFIG_LOCATIONS.join(", ")}`,
  );
}

function normalizeConfig(doc: unknown): AppConfig {
  if (!doc || typeof doc !== "object") {
    throw new Error("Configuration file must contain an object.");
  }

  const raw = doc as Record<string, unknown>;
  const supported = raw.supported_extensions;

  if (!Array.isArray(supported) || supported.length === 0) {
    throw new Error("Configuration requires a non-empty supported_extensions list.");
  }

  const supportedExtensions = supported.map((ext) => String(ext).toLowerCase());

  return {
    port: readNumber(raw.port, 80),
    version: readString(raw.version, "1.3.0"),
    site_name: readString(raw.site_name, "Deno-Play'A"),
    site_logo: readString(raw.site_logo, "https://picsum.photos/256/256"),
    auth: readBoolean(raw.auth, false),
    auth_by_code: readOptionalBoolean(raw.auth_by_code),
    actors: readBoolean(raw.actors, false),
    categories: readBoolean(raw.categories, false),
    categories_groups: readBoolean(raw.categories_groups, false),
    studios: readBoolean(raw.studios, false),
    scripts: readBoolean(raw.scripts, false),
    masks: readBoolean(raw.masks, false),
    analytics: readBoolean(raw.analytics, false),
    theme: readOptionalNumber(raw.theme),
    ar: readOptionalBoolean(raw.ar),
    nsfw: readOptionalBoolean(raw.nsfw),
    supported_extensions: supportedExtensions,
  };
}

function readNumber(value: unknown, defaultValue?: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (typeof defaultValue === "number") {
    return defaultValue;
  }

  throw new Error("Expected a numeric value.");
}

function readOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function readString(value: unknown, defaultValue: string): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return defaultValue;
}

function readBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  return defaultValue;
}

function readOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  return undefined;
}
