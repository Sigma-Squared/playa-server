import { parse } from "@std/yaml";
import { z } from "@zod/zod";
import type { PlayaConfiguration } from "./model.ts";

const CONFIG_PATH = "./config/config.yml"; //"/config/config.yml";

export type AppConfig = {
  port: number;
  version: string;
  media_root: string;
  supported_extensions: string[];
  playa_config: PlayaConfiguration;
};

const playaConfigSchema: z.ZodType<PlayaConfiguration> = z.object({
  site_name: z.string().min(1).catch("Deno-Play'A"),
  site_logo: z.string().optional().default(""),
  auth: z.boolean().catch(false),
  auth_by_code: z.boolean().optional(),
  actors: z.coerce.boolean().optional().default(false),
  categories: z.coerce.boolean().optional().default(false),
  categories_groups: z.coerce.boolean().optional().default(false),
  studios: z.coerce.boolean().optional().default(false),
  scripts: z.coerce.boolean().optional().default(false),
  masks: z.coerce.boolean().optional().default(false),
  analytics: z.coerce.boolean().optional().default(false),
  theme: z.coerce.number().optional().default(1),
  ar: z.coerce.boolean().optional().default(false),
  nsfw: z.coerce.boolean().optional().default(false),
});

const configSchema: z.ZodType<AppConfig> = z.object({
  port: z.coerce.number().int().min(1).catch(80),
  version: z.string().min(1).catch("1.3.0"),
  media_root: z.string().min(1).catch("/media"),
  supported_extensions: z.array(z.string().min(1)).nonempty()
    .transform((extensions) => extensions.map((ext) => ext.toLowerCase())),
  playa_config: playaConfigSchema,
});

let cachedConfig: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const text = await Deno.readTextFile(CONFIG_PATH);
  const parsed_yaml = parse(text);
  const normalized = configSchema.parse(parsed_yaml);
  cachedConfig = normalized;
  return cachedConfig;
}
