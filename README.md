# BoomBot

## About

This project is a simple Discord Music bot, so you can have more control over your bots and build them out to your specifications. It includes basic commands and a simple permissions system.

This project is still in progress so report any bugs or issues and they will be fixed as soon as possible.

## Installation

### Requirements

1. node.js
3. discord.js
4. Using opusscript or node-opus, ytdl-core
5. simple-youtube-api

#### node.js
Go to [this](https://nodejs.org/en/download/) link and download the nodejs installer for your operating system.
Follow the installation steps to get node.js.
NPM (node package manager) is installed with Node.

#### discord.js

```
npm install discord.js
```

#### ytdl-core
Either use opusscript or node-opus

```
npm install opusscript ytdl-core
```

or

```
npm install node-opus ytdl-core
```

#### simple-youtube-api

```
npm install simple-youtube-api
```

## Usage

````
node path/to/bot.js
````
To terminate the bot just type stop into the shell and enter.

## Versions

() => optional parameter

[] => required parameter

### v1.0.0
Commands include:
* `np` *now playing*
* `pause`
* `ping`
* `play (song)` *entering no song will give the top YouTube music videos*
* `queue`
* `resume`
* `skip`
* `stop`
* `volume (1-10)` *no volume input will display the current volume*

Features:
Play and control music on a single or multiple servers.

### v1.1.0
New commands:
* `prefix (prefix)`
* `channel [add | remove | list] [voice | text] [channel name]` *the last argument is not required while using list*
* More embedded notifications

New features:
* Server changeable prefix
* Selectable text/voice channels. If no text or voice channels are selected to be open, all of them will be open.

## License

MIT License - [LICENSE](LICENSE)

## Contributors

OC - [prgrmr126](https://github.com/prgrmr126)
