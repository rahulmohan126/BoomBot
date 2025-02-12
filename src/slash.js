const Discord = require('discord.js');

module.exports = [
  {
    name: 'play',
    description: 'Play a video or playlist from YouTube',
    options: [
      {
        name: 'query',
        description: 'A link, playlist, or search term',
        type: Discord.ApplicationCommandOptionType.String,
        required: true
      }
    ],
  },
  {
    name: 'proxy',
    description: 'Change the YouTube proxy (Bot Owner Only)',
    options: [
      {
        name: 'proxy-link',
        description: 'New proxy (or "off" to disable proxy)',
        type: Discord.ApplicationCommandOptionType.String,
        required: true
      }
    ]
  },
  {
    name: 'queue',
    description: 'Get the current queue of songs',
  },
  {
    name: 'remove',
    description: 'Remove a song from queue',
    options: [
      {
        name: 'position',
        description: 'Position of the song to be removed',
        type: Discord.ApplicationCommandOptionType.Number,
        required: true
      }
    ]
  },
  {
    name: 'pause',
    description: 'Pause the current song',
  },
  {
    name: 'resume',
    description: 'Resume the current song',
  },
  {
    name: 'ping',
    description: 'Ping the bot',
  },
  {
    name: 'uptime',
    description: 'See how long the bot has been running',
  },
  {
    name: 'skip',
    description: 'Skip the current song',
  },
  {
    name: 'stop',
    description: 'Stop all music playing',
  },
  {
    name: 'np',
    description: 'Check the currently playing song',
  },
  {
    name: 'loop',
    description: 'Loops the first song in queue (until skipped or stopped)'
  }
];