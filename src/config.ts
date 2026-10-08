import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';

export const SETTINGS_PATH = './settings.json';
export const COOKIES_PATH = './cookies.json';
export const GUILD_DATA_PATH = './data/guild.json';
/** cookies.json converted for yt-dlp, rewritten on every start */
export const YT_DLP_COOKIES_PATH = './data/yt-dlp-cookies.txt';

const settingsSchema = z.looseObject({
  TOKEN: z.string().min(1, 'TOKEN is required'),
  OWNERID: z.string().default(''),
  PREFIX: z.string().default('.'),
  PROXY: z
    .string()
    .nullish()
    .transform((proxy) => proxy || null),
});

const cookieSchema = z.looseObject({ name: z.string(), value: z.string() });

/** Accepts exported cookie objects or a Cookie header string, normalized to objects */
const cookiesSchema = z.union([
  z.array(cookieSchema),
  z.string().transform((header) =>
    header
      .split(';')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair): Cookie => {
        const index = pair.indexOf('=');
        return { name: pair.slice(0, index), value: pair.slice(index + 1) };
      }),
  ),
]);

export type Cookie = z.infer<typeof cookieSchema>;
export type Cookies = Cookie[];

export interface Config {
  token: string;
  ownerId: string;
  defaultPrefix: string;
  proxy: string | null;
  cookies: Cookies | null;
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8'));
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}

/**
 * Loads and validates settings.json and (optionally) cookies.json
 */
export async function loadConfig(
  settingsPath = SETTINGS_PATH,
  cookiesPath = COOKIES_PATH,
): Promise<Config> {
  const settings = settingsSchema.safeParse(await readJson(settingsPath));
  if (!settings.success) {
    throw new Error(`Invalid ${settingsPath}:\n${formatIssues(settings.error)}`);
  }

  let cookies: Cookies | null = null;
  try {
    const parsed = cookiesSchema.safeParse(await readJson(cookiesPath));
    if (!parsed.success) {
      throw new Error(`Invalid ${cookiesPath}:\n${formatIssues(parsed.error)}`);
    }
    cookies = parsed.data;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }

  return {
    token: settings.data.TOKEN,
    ownerId: settings.data.OWNERID,
    defaultPrefix: settings.data.PREFIX,
    proxy: settings.data.PROXY,
    cookies,
  };
}

/**
 * Persists a new proxy to settings.json, leaving every other key untouched
 */
export async function saveProxy(proxy: string | null, settingsPath = SETTINGS_PATH): Promise<void> {
  const raw = (await readJson(settingsPath)) as Record<string, unknown>;
  raw.PROXY = proxy;
  await writeFile(settingsPath, `${JSON.stringify(raw, null, 2)}\n`);
}
