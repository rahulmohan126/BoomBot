import type {
  ChatInputCommandInteraction,
  GuildMember,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import type { BoomBot } from '../bot.js';
import type { GuildSettings } from '../guilds/GuildStore.js';
import type { MusicQueue } from '../music/MusicQueue.js';
import type { MessagePayload, Tone } from '../ui/embeds.js';

export interface CommandContext {
  readonly interaction: ChatInputCommandInteraction<'cached'>;
  readonly member: GuildMember;
  readonly bot: BoomBot;
  readonly settings: GuildSettings;
  readonly queue: MusicQueue;
  /** Replies to the interaction (or edits the deferred reply) */
  readonly reply: (payload: MessagePayload | string) => Promise<void>;
  /** Replies with a coloured notification embed */
  readonly notify: (text: string, tone: Tone) => Promise<void>;
}

/** Returns an error message if the command may not run, otherwise null */
export type Precondition = (ctx: CommandContext) => string | null;

export interface Command {
  readonly data: {
    readonly name: string;
    toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
  };
  readonly preconditions?: readonly Precondition[];
  execute(ctx: CommandContext): Promise<void>;
}
