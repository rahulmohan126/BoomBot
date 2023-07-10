# BoomBot

## About

This project is a simple Discord Music bot, so you can have more control over your bots and build them out to your specifications. It includes basic commands and a simple permissions system.

This project is still in progress, so report any bugs or issues, and they will be fixed as soon as possible.

This project has been tested using both Node.js 12 and 14 on OS X (10.15), Windows 10, and Ubuntu 20.04.

## Docker

In the "Installation" section, follow instructions until the end of "Creating a settings.json" At that point, you should have everything you need to set up a docker container.

Docker Compose:
```yaml
services:
    boombot:
        image: rahulmohan126/boombot:latest
        container_name: boombot
        restart: always
        volumes:
            - ./my/saved/data:/boombot/data # ./my/saved/data can be changed accordingly
            - ./my_settings.json:/boombot/settings.json # ./my_settings.json can be changed accordingly
```

Be aware that terminal commands cannot be used while using Docker, but everything else should be fully functional.

## Installation

### Creating a Bot

Login to your discord account and go to [this](https://discordapp.com/developers/applications/) link. Select "new application" and input a name. Once the application is created, copy the **client id** from General Information. Then select bot on the left and select "add bot" and confirm (you may need to change your application name in general information if too many users have this username). Once the bot is added, select "click to reveal token" to get the **client token** in the bot menu.

To get your id, open up the discord app, go to settings -> appearance, then scroll down to Developer Mode and toggle it on. Then go to a server that you are in and find yourself in the member list and right-click. "Copy ID" should show up, click it, and **your id** will automatically be copied to your clipboard.

**Your prefix** is up to you to choose, preferably pick something short and uncommon to start a message with such as "?".

For your API key, go to [this](https://developers.google.com/youtube/v3/getting-started) link and follow instructions 1-3 (make sure to create an unrestricted key). Then go to [this](https://console.developers.google.com/) link and go to the Credentials menu; under API keys, you should see the key you created, copy the **key** and paste it into your settings.json

:warning: DO NOT SHARE YOUR API KEY OR CLIENT TOKEN WITH ANYONE :warning:

### Setting up your settings.json

Rename the "settings-template.json" to "settings.json" and fill in the appropriate information as shown below:

```
{
    "BOTID":"Your client id",
    "OWNERID":"Your id",
    "PREFIX":"Your prefix",
    "TOKEN":"Your client token",
    "GOOGLE_API_KEY":"Your API key"
}
```

Put all ids/tokens/keys in between the quotation marks.
This file should be placed in the project's root directory.

### Requirements

#### node.js
Go to [this](https://nodejs.org/en/download/) link and download the Node.js installer for your operating system.
Follow the installation steps to get node.js.
NPM (node package manager) is installed with Node.

#### Dependencies and Setup

After downloading node.js and cloning/downloading the project, in your shell, enter the following:
```bash
cd path/to/project
npm install
```

## Usage

````bash
npm start
````
To terminate the bot, just type stop into the shell and enter. You can also `reload`, `load`, and `unload` commands. Reloading allows for modified command files (this does not include "bot.js") to be refreshed without taking the bot offline. Loading and unloading are pretty straightforward (all commands are automatically loaded on bot startup).

Once the bot has been started, to use any command, type it into the shell. Example:
```bash
reload <primary name> # Command aliases won't work in the reload/load/unload commands.

stop # Safely terminates the bot
```

### Commands

* `np` *now playing*
* `pause`
* `ping`
* `play (song)` *entering no song will give the top YouTube music videos*
* `queue`
* `resume`
* `skip`
* `stop`
* `prefix (prefix)` **Admin command**
* `channel [voice | text] (channel name | all)` *the last argument is only required when changing designated channels* **Admin command**
* `loop` Loops the song.
* `invite` Gives the invite URL so others can add the bot to their server.
* `dj (dj role)` Assigns a role that can administrate the bot. **Only the owner can use this command.**

## License

MIT License - [LICENSE](LICENSE)