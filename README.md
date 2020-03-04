# BoomBot

## About

This project is a simple Discord Music bot, so you can have more control over your bots and build them out to your specifications. It includes basic commands and a simple permissions system.

This project is still in progress so report any bugs or issues and they will be fixed as soon as possible.

## Installation

##### Create a settings.json
```
{
	"BOTID":"Your client id",
	"OWNERID":"Your id",
	"PREFIX":"Your prefix",
	"TOKEN":"Your client token",
	"GOOGLE_API_KEY":"Your api key"
}
```

Put all ids/tokens/keys in between the quotation marks.

### Creating a Bot

Login to your discord account and go to [this](https://discordapp.com/developers/applications/) link. Select "new application" and input a name. Once application is created, copy the **client id** from General Information. Then select bot on the left and select "add bot" and confirm (you may need to change your application name in general information if too many users have this username). Once bot is added, in the bot menu, select "click to reveal token" to get the **client token**.

In order to get your id, open up the discord app, go to settings -> appearence, then scroll down to Developer Mode and toggle it on. Then go to a server that you are in and find yourself in the member list and right click. "Copy ID" should show up, click it and **your id** will autmatically be copied to your clipboard.

**Your prefix** is up to you to choose, preferably pick something short and uncommon to start a message with such as "?".

For your api key, go to [this](https://developers.google.com/youtube/v3/getting-started) link and follow instructions 1-3 (make sure to create an unrestricted key). Then go to [this](https://console.developers.google.com/) link and go to the Credentials menu, under API keys, you should see the key you created, copy the **key** and paste it into your settings.json

:warning: DO NOT SHARE YOUR API KEY OR CLIENT TOKEN WITH ANYONE :warning:

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
npm install -g discord.js
```

#### ytdl-core
Either use opusscript or node-opus

```
npm install -g opusscript ytdl-core
```

or

```
npm install -g node-opus ytdl-core
```

#### simple-youtube-api

```
npm install -g simple-youtube-api
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
