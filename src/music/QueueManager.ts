import type { MusicQueue } from './MusicQueue.js';

/**
 * Holds one MusicQueue per guild, created on demand
 */
export class QueueManager {
  readonly #queues = new Map<string, MusicQueue>();

  constructor(private readonly create: (guildId: string) => MusicQueue) {}

  get(guildId: string): MusicQueue {
    let queue = this.#queues.get(guildId);
    if (!queue) {
      queue = this.create(guildId);
      this.#queues.set(guildId, queue);
    }
    return queue;
  }

  find(guildId: string): MusicQueue | undefined {
    return this.#queues.get(guildId);
  }

  stopAll(): void {
    for (const queue of this.#queues.values()) queue.stop();
  }
}
