'use strict';
const startTime = Date.now();
//#region  ---------------------	Packages	---------------------
const Discord = require('discord.js');
const YouTube = require('simple-youtube-api');
const fs = require('fs');
const ytdl = require('ytdl-core');
const readline = require('readline');
const bot = new Discord.Client({ autoReconnect: true });
//#endregion
//#region  ---------------------	  Bot		---------------------

// Required
const config = JSON.parse(fs.readFileSync(`${__dirname}/settings.json`));
bot.ID = config.BOTID;
bot.OWNERID = config.OWNERID;
bot.PREFIX = config.PREFIX;
bot.TOKEN = config.TOKEN;
bot.GOOGLE_API_KEY = config.GOOGLE_API_KEY;

// Colors
bot.COLOR = 0x351C75;
bot.SUCCESS_COLOR = 0x66bb69;
bot.ERROR_COLOR = 0xEF5250;
bot.INFO_COLOR = 0x03A8F4;

// Other
bot.youtube = new YouTube(bot.GOOGLE_API_KEY);
bot.start = startTime;
bot.db = JSON.parse(fs.readFileSync(`${__dirname}/guild.json`));
bot.queue = new Map();
bot.escapeMarkdown = Discord.Util.escapeMarkdown;
bot.DETAILED_LOGGING = true;

bot.log = {
	'audioStreamDisconnected': function (msg) {
		console.table({
			Item: { Value: 'AudioStream' },
			Status: { Value: 'Stream disconnected' },
			Size: { Value: bot.queue.size },
			Guild: { Value: msg.guild.name, Id: msg.guild.id }
		}, ['Value', 'Id']);
	},
	'audioStreamConnected': function (msg) {
		console.table({
			Item: { Value: 'AudioStream' },
			Status: { Value: 'Stream connected' },
			Size: { Value: bot.queue.size },
			Guild: { Value: msg.guild.name, Id: msg.guild.id }
		}, ['Value', 'Id']);
	},
	'commandMsg': function (msg, command) {
		console.table({
			Item: { Value: 'Message' },
			Guild: { Value: msg.guild.name, Id: Number(msg.guild.id) },
			Author: { Value: msg.member.displayName, Id: Number(msg.author.id) },
			Content: { Value: msg.content, Id: Number(msg.id) },
			Command: { Value: command }
		}, ['Value', 'Id']);
	}
}

// Creates in embed notification
bot.sendNotification = function (info, code, msg, fields = [], header = null, other = {}) {
	var color;

	if (code === 'success') color = bot.SUCCESS_COLOR;
	else if (code === 'error') color = bot.ERROR_COLOR;
	else if (code === 'info') color = bot.INFO_COLOR;
	else color = bot.COLOR;

	let embed = {
		color: color,
		timestamp: Date(Date.now()),
		fields: fields,
	};

	if (info !== '') {
		embed.description = info;
	}

	if (header && msg.member) {
		embed.author = {
			name: header,
			iconURL: msg.member.user.displayAvatarURL()
		}

		embed.footer = {
			text: msg.member.displayName,
			iconURL: msg.member.user.displayAvatarURL()
		}
	}
	else if (msg.member) {
		embed.author = {
			name: msg.member.displayName,
			iconURL: msg.member.user.displayAvatarURL()
		}
	}

	if (other) {
		Object.assign(embed, other);
	}

	msg.channel.send('', { embed });
};

// Converts YouTube duration (string) to seconds (number)
bot.stringToTime = function (duration) {
	const letter = ['S', 'M', 'H'];
	const value = [1, 60, 3600];
	const durationComponents = duration.slice(2).split(/(.+?[A-Z])/g);

	var time = 0;

	durationComponents.forEach(element => {
		if (element != '') {
			time += parseInt(element.slice(0, element.length - 1)) * value[letter.indexOf(element[element.length - 1])];
		}
	});
	return time * 1000;
};

// Returns formatted time string
bot.timeToString = function (epochTime) {
	var returnStr = new Date(epochTime).toUTCString().split(' ')[4];

	// Removes hour section if not necessary
	if (returnStr.startsWith('00:')) {
		returnStr = returnStr.substring(3);
	}

	return returnStr;
};

// Returns the total time of all the songs in a server queue
bot.totalQueueLength = function (serverMap) {
	var totalTime = serverMap.songs.reduce((acc, cur) => acc + cur.duration, 0);
	totalTime -= Date.now() - serverMap.songs[0].startTime; // Accounts for the already completed portion of song
	return totalTime;
};

// Handles video requests from play command
bot.handleVideo = async function (video, msg, voiceChannel, playlist = false) {
	// Handles video exception
	if (video.description === 'This video is unavailable.' || video.description === 'This video is private.') {
		return;
	}

	const serverQueue = bot.queue.get(msg.guild.id);

	// Creates a "song"
	video = await bot.youtube.getVideoByID(video.id);
	const song = {
		id: video.id,
		title: Discord.Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`,
		thumbnail: video.thumbnails.default.url,
		duration: bot.stringToTime(video.raw.contentDetails.duration),
		startTime: -1, // Song has not started yet
		requestedBy: msg.member
	};

	if (!serverQueue) {
		// Creates the server construct if necessary and then adds the song
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
			loop: false,
			seeking: false
		};

		bot.queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		// Joins channel and handles all exceptions
		try {
			queueConstruct.connection = await voiceChannel.join();

			bot.log['audioStreamConnected'](msg);

			queueConstruct.connection.on('disconnect', () => {
				bot.queue.delete(msg.guild.id);
				bot.log['audioStreamDisconnected'](msg);
			})

			// queueConstruct.songs[0] = bot.play(msg.guild, queueConstruct.songs[0]);
			bot.play(msg.guild, queueConstruct.songs[0]);
		} catch (err) {
			console.log(err);//bot.sendNotification('Could not join voice channel', 'error', msg);
		}
	} else {
		serverQueue.songs.push(song);

		// Playlists do not load per message but instead loads the entire playlist and responds with is own
		// custom message as shown in play.js.
		if (!playlist) {
			bot.sendNotification('', 'success', {
				'channel': serverQueue.textChannel, 'member': song.requestedBy
			}, [
				{
					name: "Duration",
					value: `\`${bot.timeToString(song.duration)}\``,
					inline: true
				},
				{
					name: "Time Until Played",
					value: `\`${bot.timeToString(bot.totalQueueLength(serverQueue) - song.duration)}\``,
					inline: true
				},
				{
					name: "Requested By",
					value: "`Mr. Perkins`"
				}
			], 'Added to queue', {
				title: song.title,
				thumbnail: { url: song.thumbnail },
				url: song.url
			});
		}
	}
};

// Plays stream of first video in server map
bot.play = function (guild, song, seek = 0) {
	const serverQueue = bot.queue.get(guild.id);

	if (!song) {
		if (bot.DETAILED_LOGGING) console.error(`Guild: ${serverQueue.textChannel.guild.name} ` +
			`(${serverQueue.textChannel.guild.id}) | Audio Disconnection: End of queue`);
		serverQueue.voiceChannel.leave();
		bot.queue.delete(guild.id);
		return;
	}

	// 1024 = 1 KB, 1024 x 1024 = 1MB. The highWaterMark determines how much of the stream will be preloaded.
	// Dedicating more memory will make streams more smoother but can be cause issues on machines with low RAM
	// and a large highWaterMark. The amount of RAM is per audio stream
	const dispatcher = serverQueue.connection.play(ytdl(song.url, {
		quality: 'highestaudio', highWaterMark: 1024 * 1024 * 2
	}), { seek: seek });

	dispatcher.on('start', () => {
		if (seek !== 0) song.startTime = Date.now() - (seek * 1000);
		else song.startTime = Date.now();
	})

	dispatcher.on('finish', () => {
		if (serverQueue.seeking) {
			serverQueue.seeking = false; // Flip it back
			return;
		}

		// Music has been stopped
		if (bot.queue.get(guild.id) === undefined) return;

		// Plays the next song (if looped, the queue will remian unchanged and continue playing the first item)
		if (!serverQueue.loop) serverQueue.songs.shift();
		// song = bot.play(guild, serverQueue.songs[0]);
		bot.play(guild, serverQueue.songs[0]);
	});

	dispatcher.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	bot.sendNotification(`🎶 Start playing: **${song.title}**`, 'success', {
		'channel': serverQueue.textChannel, 'member': song.requestedBy
	});

	//if (serverQueue.seeking) song.startTime = Date.now() - (seek * 1000);
	//else song.startTime = Date.now();
	// return song;
};

// Gets a guild config from id
bot.getGuild = function (guildID) {
	// In case bot guild has been deleted or not created yet
	if (!bot.db[guildID]) {
		bot.db[guildID] = {
			prefix: '.',
			textChannel: '',
			voiceChannel: ''
		};

		bot.saveConfig();
	}

	return bot.db[guildID];
};

// Saves guild config database to file
bot.saveConfig = function () {
	console.log('Config: Reloaded')
	fs.writeFileSync(`${__dirname}/guild.json`, JSON.stringify(bot.db, null, 4));
};

//#endregion
//#region  ---------------------	Commands	---------------------

var commands = {};

// BASE COMMANDS (cannot be reloaded)

commands.help = {};
commands.help.hide = true;
commands.help.main = function (bot, msg) {

	const GUILD_PREFIX = bot.getGuild(msg.guild.id).prefix;

	if (msg.content === '') {
		var cmds = [];

		for (let command in commands) {
			if (!commands[command].hide) {
				cmds.push(command);
			}
		}

		cmds = cmds.join(', ');

		bot.sendNotification(`Bot prefix: ${GUILD_PREFIX}`, 'info', msg, [
			{
				name: 'Commands: ',
				value: cmds,
				inline: true
			}
		]);
	}
	else {
		let command = msg.content;

		if (commands[command]) {

			bot.sendNotification(`Bot prefix: ${GUILD_PREFIX} | Command: ${command}`, 'info', msg, [
				{
					name: 'Description: ',
					value: commands[command].help,
				},
				{
					name: 'Usage: ',
					value: GUILD_PREFIX + commands[command].usage,
				}
			]);
		}
		else {
			bot.sendNotification('That command does not exist', 'error', msg);
		}
	}
};

commands.reload = {};
commands.reload.hide = true;
commands.reload.main = function (bot, msg) {
	let command = msg.content.split(' ')[0];

	if (msg.author.id === bot.OWNERID) {
		try {
			if (commands[command]) {

				var directory = `${__dirname}/commands/${command}.js`;
				delete commands[command];
				delete require.cache[require.resolve(directory)];
				commands[command] = require(directory);
				bot.sendNotification(`Reloaded ${command} command successfully.`, 'success', msg);

				if (bot.DETAILED_LOGGING) console.log(`Command: "${command}" | Status: Reloaded`);
			}
		}
		catch (err) {
			bot.sendNotification('Command not found', 'error', msg);
		}
	}
	else {
		bot.sendNotification('You do not have permission to use this command.', 'error', msg);
	}
};

//#endregion
//#region  ---------------------	Functions   ---------------------

var consoleListener = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

// Checks if the message starts with the prefix or mentions the bot
// and the text channel is permitted to use bot commands in.
var validMsg = function (msg, guild) {
	// Make sure the message starts with the appropriate prefix or mentions the bot
	if (!msg.content.trim().startsWith(guild.prefix) && (msg.mentions.members.first() === undefined ||
		msg.mentions.members.first().id !== bot.ID)) {
		return false;
	}

	// If no dedicated music channel, then all are permitted. Otherwise, it must be the specified text channel
	if (guild.textChannel !== '' && guild.textChannel !== msg.channel.id) {
		return false;
	}

	return true;
};

// Remove the prefix/mention from the beginning of the message and returns the command
var parseMsg = function (msg, guildPrefix) {
	var command;

	// Removes the prefix/mention and command from the message to isolate the arguments
	if (msg.content.startsWith(guildPrefix)) {
		command = msg.content.split(' ')[0].slice(guildPrefix.length);
		msg.content = msg.content.slice(guildPrefix.length + command.length).trimLeft();
	}
	else {
		command = msg.content.split(' ')[1];
		msg.content = msg.content.splice(3 + String(bot.ID).length + 1 + 1 + command.length).trimLeft();
	}

	return command;
}

// Loads commands in from ./commands folder
var loadCommands = function () {
	var files = fs.readdirSync(`${__dirname}/commands/`);

	for (let file of files) {
		if (file.endsWith('.js')) {
			let fileName = file.slice(0, -3);
			try {
				commands[fileName] = require(`${__dirname}/commands/${file}`);
				if (bot.DETAILED_LOGGING) console.table({ Command: fileName, Status: 'Loaded' });
			} catch (error) {
				if (bot.DETAILED_LOGGING) console.table({ Command: fileName, Status: 'Failed to load' });
			}
		}
	}

	console.log('———— All Commands Loaded! ————');
};

//#endregion
//#region  ---------------------	Handlers	---------------------

bot.on('ready', () => {
	bot.user.setActivity(`over ${bot.guilds.cache.array().length} servers...`, { type: 'WATCHING' });
	loadCommands();
	const startuptime = Date.now() - startTime;
	console.log(`Ready to begin! Serving in ${bot.guilds.cache.array().length} servers. Startup time: ${startuptime}ms`);
});

bot.on('message', msg => {
	const guild = bot.getGuild(msg.guild.id);

	if (msg.author.id != bot.ID && validMsg(msg, guild)) {

		// Gets the command and remove the prefix/mention from the beginning of the message
		let command = parseMsg(msg, guild.prefix);

		if (commands[command]) {
			// Logs guild, author, and message if enabled
			if (bot.DETAILED_LOGGING) bot.log['commandMsg'](msg, command);

			// Runs the command
			commands[command].main(bot, msg);
		}
	}
});

bot.on('error', (err) => {
	console.error('—————————— ERROR ——————————');
	console.error(err);
	console.error('———————— END ERROR ————————');
});

bot.on('disconnected', () => {
	console.error('——————— DISCONNECTED ——————');
});

bot.on('guildCreate', guild => {
	bot.user.setActivity(`over ${bot.guilds.array().length} servers...`, { type: 'WATCHING' });
	bot.getGuild(guild.id); // Initializes a new guild
	if (bot.DETAILED_LOGGING) console.log(`New guild: ${guild.name}`);
})

bot.login(bot.TOKEN);

consoleListener.on('line', function (input) {
	if (input === 'stop') {
		console.log('Destroying bot and exiting application...');
		bot.destroy();
		process.exit(0);
	}
});

//#endregion