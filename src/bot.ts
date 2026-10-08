import { ActivityType, Client, Events, GatewayIntentBits } from 'discord.js';
import { GUILD_DATA_PATH, type Config } from './config.js';
import { onGuildCreate } from './events/guildCreate.js';
import { onInteractionCreate } from './events/interactionCreate.js';
import { onReady } from './events/ready.js';
import { onVoiceStateUpdate } from './events/voiceStateUpdate.js';
import { GuildStore } from './guilds/GuildStore.js';
import { MusicQueue } from './music/MusicQueue.js';
import { QueueManager } from './music/QueueManager.js';
import { card, notice } from './ui/embeds.js';
import { YouTubeService } from './youtube/YouTubeService.js';

/**
 * Composition root: owns the Discord client and the bot's services
 */
export class BoomBot {
  readonly client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });
  readonly youtube: YouTubeService;
  readonly guilds: GuildStore;
  readonly queues: QueueManager;

  constructor(
    readonly config: Config,
    readonly startedAt = Date.now(),
  ) {
    this.youtube = new YouTubeService(config.cookies, config.proxy);
    this.guilds = new GuildStore(GUILD_DATA_PATH, config.defaultPrefix);
    this.queues = new QueueManager((guildId) => this.#createQueue(guildId));
  }

  async start(): Promise<void> {
    await this.guilds.load();
    this.#registerEvents();
    // Create the YouTube client up front so the first /play is fast
    this.youtube
      .client()
      .catch((err: unknown) => console.error('Failed to create YouTube client:', err));
    await this.client.login(this.config.token);
  }

  async shutdown(): Promise<void> {
    this.queues.stopAll();
    await this.client.destroy();
    await this.guilds.save();
  }

  updatePresence(): void {
    this.client.user?.setActivity(`over ${this.client.guilds.cache.size} servers...`, {
      type: ActivityType.Watching,
    });
  }

  #createQueue(guildId: string): MusicQueue {
    const queue = new MusicQueue(guildId, this.youtube);

    queue.on('trackStart', (track) => {
      queue.textChannel
        ?.send(
          card({
            header: 'Started playing',
            body: `🎶 [**${track.title}**](${track.url})`,
            tone: 'success',
            member: track.requestedBy,
          }),
        )
        .catch((err: unknown) => console.error('Failed to announce track:', err));
    });

    queue.on('trackError', (track, err) => {
      console.error(`Stream error for ${track.url}:`, err);
      queue.textChannel
        ?.send(
          notice(
            `Sorry, there was an error processing "${track.title}", moving to the next song in the queue`,
            'error',
          ),
        )
        .catch((sendErr: unknown) => console.error('Failed to send error notice:', sendErr));
    });

    return queue;
  }

  #registerEvents(): void {
    const handle =
      <Args extends unknown[]>(
        name: string,
        handler: (bot: BoomBot, ...args: Args) => Promise<void>,
      ) =>
      (...args: Args) => {
        handler(this, ...args).catch((err: unknown) =>
          console.error(`Error in ${name} handler:`, err),
        );
      };

    this.client.once(Events.ClientReady, handle('ready', onReady));
    this.client.on(Events.InteractionCreate, handle('interactionCreate', onInteractionCreate));
    this.client.on(Events.VoiceStateUpdate, handle('voiceStateUpdate', onVoiceStateUpdate));
    this.client.on(Events.GuildCreate, handle('guildCreate', onGuildCreate));
    this.client.on(Events.Error, (err) => console.error('Client error:', err));
    this.client.on(Events.ShardDisconnect, () => console.error('——————— DISCONNECTED ——————'));
  }
}
