import { BoomBot } from './bot.js';
import { loadConfig } from './config.js';

const startedAt = Date.now();

try {
  const bot = new BoomBot(await loadConfig(), startedAt);

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    bot.shutdown().then(
      () => process.exit(0),
      (err: unknown) => {
        console.error('Error during shutdown:', err);
        process.exit(1);
      },
    );
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  await bot.start();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
