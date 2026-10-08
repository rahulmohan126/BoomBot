import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';

const settingsSchema = z.object({
  prefix: z.string(),
  textChannel: z.string().default(''),
  voiceChannel: z.string().default(''),
  dj: z.string().default(''),
  instant: z.boolean().default(true),
});

export type GuildSettings = z.infer<typeof settingsSchema>;

/**
 * Per-guild settings persisted to a JSON file (keyed by guild ID)
 */
export class GuildStore {
  readonly #settings = new Map<string, GuildSettings>();
  #pendingWrite: Promise<void> = Promise.resolve();

  constructor(
    private readonly path: string,
    private readonly defaultPrefix: string,
  ) {}

  async load(): Promise<void> {
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(await readFile(this.path, 'utf8')) as Record<string, unknown>;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      raw = {};
    }

    for (const [guildId, value] of Object.entries(raw)) {
      const parsed = settingsSchema.safeParse({ prefix: this.defaultPrefix, ...(value as object) });
      if (parsed.success) this.#settings.set(guildId, parsed.data);
      else console.warn(`Ignoring invalid settings for guild ${guildId}`);
    }
  }

  get(guildId: string): GuildSettings | undefined {
    return this.#settings.get(guildId);
  }

  /**
   * Gets a guild's settings, creating (and saving) defaults for new guilds
   */
  ensure(guildId: string): GuildSettings {
    let settings = this.#settings.get(guildId);
    if (!settings) {
      settings = settingsSchema.parse({ prefix: this.defaultPrefix });
      this.#settings.set(guildId, settings);
      void this.save();
    }
    return settings;
  }

  /**
   * Writes all settings to disk. Writes are serialized and atomic (temp file + rename).
   */
  save(): Promise<void> {
    const data = `${JSON.stringify(Object.fromEntries(this.#settings), null, 4)}\n`;
    const write = async () => {
      await mkdir(dirname(this.path), { recursive: true });
      const temp = `${this.path}.tmp`;
      await writeFile(temp, data);
      await rename(temp, this.path);
    };

    this.#pendingWrite = this.#pendingWrite.then(write, write).catch((err: unknown) => {
      console.error('Failed to save guild settings:', err);
    });
    return this.#pendingWrite;
  }
}

/**
 * Whether the guild restricts music to a voice channel other than this one
 */
export function isVoiceChannelAllowed(settings: GuildSettings, channelId: string): boolean {
  return settings.voiceChannel === '' || settings.voiceChannel === channelId;
}
