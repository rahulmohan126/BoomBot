# BoomBot

A self-hosted Discord music bot that plays audio from YouTube, written in TypeScript.

- Slash commands for playing videos, playlists, and search results
- Queue management, looping, pause/resume, now-playing progress
- Optional YouTube cookies and HTTP proxy support
- Per-server settings (allowed voice channel, DJ role)

Requires **Node.js 22.12 or newer** and **[yt-dlp](https://github.com/yt-dlp/yt-dlp#installation)** (which streams the audio) on your `PATH`, or at the path in the `YT_DLP_PATH` environment variable. Keep yt-dlp up to date (e.g. `brew upgrade yt-dlp` or `yt-dlp -U`): YouTube changes often break older versions.

## Commands

| Command               | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `/play <query>`       | Play a YouTube video link, playlist link, or the top search result          |
| `/queue`              | Show the upcoming songs and time left                                       |
| `/np`                 | Show the current song and its progress                                      |
| `/skip`               | Skip the current song                                                       |
| `/pause` / `/resume`  | Pause or resume playback                                                    |
| `/loop`               | Loop the current song until skipped or stopped                              |
| `/remove <position>`  | Remove a song from the queue                                                |
| `/stop`               | Stop playback, clear the queue and leave the channel                        |
| `/ping`               | Check the bot's latency                                                     |
| `/uptime`             | See how long the bot has been running                                       |
| `/proxy <proxy-link>` | Change the YouTube proxy, or `off` to disable it (bot or server owner only) |

The bot leaves the voice channel when everyone else leaves, or after 5 minutes with an empty queue.

## Setup

### 1. Create a Discord bot

1. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Under **Bot**, reset and copy the **token**. No privileged gateway intents are needed.
3. Invite the bot with the `bot` and `applications.commands` scopes and the **Connect**, **Speak**, **Send Messages**, **Embed Links** and **Attach Files** permissions.
4. To get **your user ID**, enable Developer Mode in Discord (Settings → Advanced), then right-click your name and choose "Copy User ID".

### 2. Create `settings.json`

Copy `settings-template.json` to `settings.json` in the project root and fill it in:

```json
{
  "TOKEN": "Your bot token",
  "OWNERID": "Your Discord user ID",
  "PREFIX": ".",
  "PROXY": null
}
```

- `PROXY` is optional: an `http(s)://host:port` proxy for YouTube requests. It is updated by the `/proxy` command.
- Older settings files still work; `BOTID` and `GOOGLE_API_KEY` are no longer needed and are ignored.

:warning: Never share your bot token. :warning:

### 3. (Optional) Add YouTube cookies

If YouTube blocks playback (age-restricted videos, "sign in to confirm you're not a bot"), export your YouTube cookies to `cookies.json` in the project root, either as an array of `{ "name", "value" }` objects (the format browser cookie-export extensions produce) or as a single `Cookie` header string. They are used for both metadata lookups and yt-dlp (converted to `data/yt-dlp-cookies.txt` on startup). Use a spare account: heavy automated use can get an account flagged.

### 4. Install and run

```bash
npm install
npm run build
npm start
```

Per-server settings are stored in `data/guild.json`.

## Docker

```bash
docker build -t boombot .
```

Docker Compose:

```yaml
services:
  boombot:
    image: boombot
    container_name: boombot
    restart: always
    volumes:
      - ./settings.json:/boombot/settings.json
      - ./cookies.json:/boombot/cookies.json # optional
      - ./data:/boombot/data
```

## Development

| Script              | Description                             |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Run from source with auto-restart (tsx) |
| `npm run build`     | Compile to `dist/`                      |
| `npm test`          | Run the unit tests (Vitest)             |
| `npm run lint`      | Lint with ESLint                        |
| `npm run format`    | Format with Prettier                    |
| `npm run typecheck` | Type-check without emitting             |

### Project structure

```
src/
  index.ts            Entry point: load config, start the bot, graceful shutdown
  bot.ts              BoomBot: owns the Discord client and services, wires events
  config.ts           settings.json / cookies.json loading and validation
  commands/           One file per slash command, plus shared preconditions (guards.ts)
  events/             Discord event handlers
  music/              MusicQueue (per-server playback state), QueueManager, Track
  youtube/            YouTubeService (search, videos, playlists via youtubei.js; audio via yt-dlp) and helpers
  guilds/             Per-server settings store and permission levels
  ui/                 Embed builders and time/progress formatting
test/                 Unit tests
```

## License

MIT License - [LICENSE](LICENSE)
