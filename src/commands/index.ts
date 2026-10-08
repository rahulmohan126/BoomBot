import { loop } from './loop.js';
import { np } from './np.js';
import { pause } from './pause.js';
import { ping } from './ping.js';
import { play } from './play.js';
import { proxy } from './proxy.js';
import { queue } from './queue.js';
import { remove } from './remove.js';
import { resume } from './resume.js';
import { skip } from './skip.js';
import { stop } from './stop.js';
import type { Command } from './types.js';
import { uptime } from './uptime.js';

export const commands: readonly Command[] = [
  play,
  proxy,
  queue,
  remove,
  pause,
  resume,
  ping,
  uptime,
  skip,
  stop,
  np,
  loop,
];

export const commandsByName: ReadonlyMap<string, Command> = new Map(
  commands.map((command) => [command.data.name, command]),
);
