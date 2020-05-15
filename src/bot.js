'use strict';
const startTime = Date.now();
//#region  ---------------------	Packages	---------------------
const Discord = require('discord.js');
const YouTube = require('simple-youtube-api');
const fs = require('fs');
const ytdl = require('ytdl-core');
const readline = require('readline');

const LOGGING = true;
//#endregion
//#region  ---------------------	Classes		---------------------

class Bot extends Discord.Client {
	constructor(options, config) {
		super(options);

		this.START_TIME = Date.now();

		this.ID = config.BOTID;
		this.OWNERID = config.OWNERID;
		this.PREFIX = config.PREFIX;
		this.TOKEN = config.TOKEN;
		this.GOOGLE_API_KEY = config.GOOGLE_API_KEY;

		this.COLORS = {
			DEFAULT: 0x351C75,
			SUCCESS: 0x66bb69,
			ERROR: 0xEF5250,
			INFO: 0x03A8F4
		}

		this.youtube = new YouTube(this.GOOGLE_API_KEY);
		this.database = new Map();
		this.commands = [];

		// This dictionary redirects to commands (including aliases)
		this.commandDict = {}

		this.escapeMarkdown = Discord.Util.escapeMarkdown;

		this.log = {
			'audioStreamDisconnected': function (msg) {
				console.table({
					Item: { Value: 'AudioStream' },
					Status: { Value: 'Stream disconnected' },
					// Size: { Value: bot.queue.size },
					Guild: { Value: msg.guild.name, Id: msg.guild.id }
				}, ['Value', 'Id']);
			},
			'audioStreamConnected': function (msg) {
				console.table({
					Item: { Value: 'AudioStream' },
					Status: { Value: 'Stream connected' },
					// Size: { Value: bot.queue.size },
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
	}

	/**
	 * Loads all the guild datas
	 */
	loadGuilds() {
		let jsonInfo = JSON.parse(fs.readFileSync(`${__dirname}/guild.json`));

		for (let guild of this.guilds.cache.values()) {
			if (guild.id in jsonInfo) {
				this.database.set(guild.id, new Guild(this, guild, jsonInfo[guild.id]));
			}
			else {
				this.database.set(guild.id, new Guild(guild));
			}
		}

	}

	/**
	 * Loads all the bot commands
	 */
	loadCommands() {

		let currentCommand = new Command('help', {
			hide: true,
			main: function (bot, guild, msg) {
				const GUILD_PREFIX = bot.getGuild(msg.guild).prefix;

				if (msg.content === '') {
					var cmds = {};

					for (let command of bot.commands) {
						if (!command.hide) {
							if (!cmds[command.module]) {
								cmds[command.module] = [];
							}

							cmds[command.module].push(command.name);
						}
					}

					let embedList = [];

					for (let key in cmds) {
						embedList.push({
							name: `${key}`,
							value: cmds[key].join(', '),
							inline: false
						})
					}

					embedList.push({
						name: 'soundboard',
						value: Object.keys(guild.soundboard).join(', '),
						inline: false
					})

					bot.sendNotification(`Bot prefix: ${GUILD_PREFIX} | See more using: \`help <command name>\``, 'info', msg, embedList);
				}
				else {
					let command = bot.commands.filter(item => item.name === msg.content)[0] || guild.soundboard[msg.content];
					if (command) {
						bot.sendNotification(`Bot prefix: ${GUILD_PREFIX} | Command: ${command.name}`, 'info', msg, [
							{
								name: 'Description: ',
								value: command.help,
							},
							{
								name: 'Usage: ',
								value: GUILD_PREFIX + command.usage,
							}
						]);
					}
					else {
						bot.sendNotification('That command does not exist', 'error', msg);
					}
				}
			}
		});

		this.commands.push(currentCommand);
		this.commandDict['help'] = currentCommand;

		var files = fs.readdirSync(`${__dirname}/commands/`);

		for (let file of files) {
			if (file.endsWith('.js')) {
				let fileName = file.slice(0, -3);
				try {
					this.loadCommand(fileName);

					if (LOGGING) console.table({ Command: fileName, Status: 'Loaded' });
				} catch (error) {
					console.log(error);
					if (LOGGING) console.table({ Command: fileName, Status: 'Failed to load' });
				}
			}
		}

		console.log('———— All Commands Loaded! ————');
	}

	/**
	 * Loads all global and guild soundboard commands
	 */
	loadSoundboard() {
		var audioFiles = fs.readdirSync(__dirname + '/soundboard/');
		for (let file of audioFiles) {
			let fileDirectory = __dirname + '/soundboard/' + file;
			if (file.endsWith('.mp3')) {
				let fileName = file.slice(0, -4);
				try {
					const command = this.createSoundboardCommand(fileName);

					this.commands.push(command);
					this.commandDict[fileName] = command;

					if (LOGGING) console.table({ Command: fileName, Status: 'Loaded' });
				} catch (error) {
					console.log(error);
					if (LOGGING) console.table({ Command: fileName, Status: 'Failed to load' });
				}
			}
			// Loads guild soundboard
			else if (fs.statSync(fileDirectory).isDirectory()) {
				var guildFiles = fs.readdirSync(fileDirectory);

				for (let subfile of guildFiles) {
					let subFileName = subfile.slice(0, -4);
					try {
						const command = this.createSoundboardCommand(subFileName, true);

						const guild = this.getGuildByID(file);

						if (guild) {
							guild.soundboard[subFileName] = command;
						}
						else {
							throw new Error('No guild with that id exists');
						}

						if (LOGGING) console.table({ Command: subFileName, Status: 'Loaded' });
					} catch (error) {
						console.log(error);
						if (LOGGING) console.table({ Command: subFileName, Status: 'Failed to load' });
					}
				}
			}
		}
	}

	/**
	 * Unloads a command indentified by its primary name
	 * @param {String} name Command name
	 */
	unloadCommand(name) {
		const directory = `${__dirname}/commands/${name}.js`

		let command = this.commands.find(command => command.name == name);

		if (!command) {
			console.error('Command not found');
			return false;
		}
		else if (command.soundboard) {
			console.error('Soundboard noises cannot be reloaded');
			return false;
		}

		// Removes the command from the list
		this.commands = this.commands.filter(command => command.name != name);

		delete this.commandDict[name];

		// Deletes the command from the dict
		if (command.keywords !== undefined) {
			command.keywords.forEach(keyword => {
				delete this.commandDict[keyword];
			});
		}

		// Deletes the command at source and the cache
		command = null;
		delete require.cache[require.resolve(directory)];

		return true;
	}

	/**
	 * Loads a command indentified by its primary name
	 * @param {String} name Command name
	 */
	loadCommand(name) {
		try {
			const directory = `${__dirname}/commands/${name}.js`

			let command = new Command(name, require(directory));

			bot.commands.push(command);

			this.commandDict[name] = command;

			if (command.keywords !== undefined) {
				for (let keyword of command.keywords) {
					this.commandDict[keyword] = command;
				}
			}

			return true;
		}
		catch (err) {
			return false;
		}
	}

	createSoundboardCommand(fileName, guildCommand = false) {
		return new Command(fileName, {
			main: function (bot, guild, msg) {
				const voiceChannel = msg.member.voice.channel;

				if (voiceChannel && guild.checkVoiceChannelByID(voiceChannel.id)) {
					guild.queue.playFile(msg, voiceChannel, fileName, guildCommand);
				}
			},
			help: 'A soundboard effect',
			usage: fileName,
			soundboard: true,
		});
	}

	/**
	 * Runs a command from a m
	 * @param {Command} command 
	 * @param {Guild} guild 
	 * @param {Discord.Message} msg 
	 */
	runCommand(command, guild, msg) {
		this.commandDict[command].main(this, guild, msg);
	}

	/**
	 * Gets guild
	 * @param {Discord.Guild} guild 
	 * @returns {Guild}
	 */
	getGuild(guild) {
		if (!this.database.has(guild.id)) {
			this.database.set(guild.id, new Guild(this, guild));
			this.save();
		}

		return this.database.get(guild.id);
	}

	/**
	 * Gets guild by id
	 * @param {Discord.Snowflake} id
	 * @returns {Guild} or null if guild with id doesn't exist
	 */
	getGuildByID(id) {
		if (!this.database.has(id)) {
			null;
		}

		return this.database.get(id);
	}

	/**
	 * Sends a embed notification from the bot.
	 */
	sendNotification(info, code, msg, fields = [], header = null, other = {}) {
		var color;

		if (code === 'success') color = this.COLORS.SUCCESS;
		else if (code === 'error') color = this.COLORS.ERROR;
		else if (code === 'info') color = this.COLORS.INFO;
		else color = this.COLORS.DEFAULT;

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
	}

	/**
	 * Exports the databse in JSON format
	 */
	save() {
		let jsonDatabase = {}

		for (let guildID of this.database.keys()) {
			jsonDatabase[guildID] = this.database.get(guildID).json();
		}

		fs.writeFileSync(`${__dirname}/guild.json`, JSON.stringify(jsonDatabase, null, 4));
	}

	/**
	 * Initializes the bot
	 */
	start() {
		this.loadGuilds();
		this.loadCommands();
		this.loadSoundboard();
	}
}

class Guild {
	constructor(client, data, info = {
		prefix: client.PREFIX,
		textChannel: '',
		voiceChannel: '',
		dj: '',
		instant: false
	}) {
		Object.assign(this, data);

		this.client = client;

		this.prefix = info.prefix;
		this.textChannel = info.textChannel;
		this.voiceChannel = info.voiceChannel;
		this.dj = info.dj;
		this.instant = info.instant;

		this.soundboard = {};

		this.queue = new MusicQueue(this.client);
	}

	/**
	 * Checks the command permissions of the member
	 * @param {Discord.GuildMemberResolvable} memberResolvable 
	 */
	checkPerms(memberResolvable) {
		// 0 => All perms
		// 1 => Most perms
		// 2 => Basic perms

		var user = this.members.guild.member(memberResolvable);

		if (this.ownerID == user.id) {
			return 0;
		}
		else if (this.dj != '' && user.roles.cache.has(this.dj)) {
			return 1;
		}
		else {
			return 2;
		}
	}

	/**
	 * Checks if the text channel is the one permitted by the guild
	 * @param {Discord.Snowflake} channelID
	 */
	checkTextChannelByID(channelID) {
		return this.textChannel == '' ? true : this.textChannel == channelID;
	}

	/**
	 * Checks if the voice channel is the one permitted by the guild
	 * @param {Discord.Snowflake} channelID
	 */
	checkVoiceChannelByID(channelID) {
		return this.voiceChannel == '' ? true : this.voiceChannel == channelID;
	}

	/**
	 * Checks the validity of a message
	 * @param {Discord.Message} msg 
	 */
	validMessage(msg) {
		return (this.checkTextChannelByID(msg.channel.id) ||
			this.checkPerms(msg.member) < 2) && (msg.content.startsWith(this.prefix) || msg.content.startsWith(`<@!${this.client.ID}>`));
	}

	/**
	 * Removed the prefix or bot mention from the start of the message
	 * @param {Discord.Message} msg 
	 */
	extractCommand(msg) {
		if (msg.content.startsWith(this.prefix)) {
			msg.content = msg.content.replace(this.prefix, '').trimLeft();
		}
		else if (msg.content.startsWith(`<@!${this.client.ID}>`)) {
			msg.content = msg.content.replace(`<@!${this.client.ID}>`, '').trimLeft();
		}

		const command = msg.content.split(' ')[0].toLowerCase();
		msg.content = msg.content.replace(command, '').trimLeft();

		return command;
	}

	hasSoundboard(command) {
		return !!this.soundboard[command];
	}

	/**
	 * Gets the guild data in JSON
	 */
	json() {
		return {
			prefix: this.prefix,
			textChannel: this.textChannel,
			voiceChannel: this.voiceChannel,
			dj: this.dj,
			instant: this.instant
		};
	}

	/**
	 * Saves the guild config
	 */
	save() {
		this.client.save();
	}
}

class Command {
	constructor(commandName, command) {
		this.name = commandName;
		this.main = command.main;
		this.keywords = command.keywords;
		this.usage = command.usage;
		this.help = command.help;
		this.module = command.module;

		// Whether to display it in the HELP command.
		this.hide = command.hide ? true : false;

		// If it is a soundboard effect or not
		this.soundboard = command.soundboard ? true : false;
	}
}

class MusicQueue {
	constructor(client) {
		// Channels to send data to
		this.client = client;

		this.text = null;
		this.voice = null;

		// Music informaiton
		this.connection = null;
		this._volume = 5;
		this.songs = [];

		// Status information
		this.playing = false;
		this.looping = false;
		this.seeking = false;

		this.inUse = false;
		this.usingSB = false;
	}

	/**
	 * Volume getter
	 */
	get volume() {
		return this._volume;
	}

	/**
	 * Volume setter. Also changes connection dispatcher volume.
	 */
	set volume(volume) {
		if (this.connection != null) {
			this._volume = volume;
			this.connection.dispatcher.setVolumeLogarithmic(volume);
		}
	}

	/**
	 * Starts voice channel connection
	 */
	async join() {
		if (this.voice !== null) {
			this.inUse = true;
			this.connection = await this.voice.join();
		}
	}

	/**
	 * Resets music queue to default settings. Except for volume, that remains the same.
	 */
	end() {
		if (this.voice) {
			this.voice.leave();
		}

		this.text = null;
		this.voice = null;

		this.connection = null;
		this.songs = [];

		this.playing = false;
		this.looping = false;
		this.seeking = false;

		this.inUse = false;
	}

	/**
	 * Converts a epoch time into a time string.
	 * @param {Number} epochTime
	 * @returns {String}
	 */
	timeToString(epochTime) {
		var returnStr = new Date(epochTime).toUTCString().split(' ')[4];

		// Removes hour section if not necessary
		if (returnStr.startsWith('00:')) {
			returnStr = returnStr.substring(3);
		}

		return returnStr;
	}

	/**
	 * Returns the remaining play time of the queue
	 */
	get totalTime() {
		var totalTime = this.songs.reduce((acc, cur) => acc + cur.duration, 0);
		totalTime -= Date.now() - this.songs[0].startTime;
		return totalTime;
	}

	/**
	 * 
	 * @param {youtube.Video} video 
	 * @param {Discord.Message} msg 
	 * @param {Discord.VoiceChannel} voiceChannel 
	 * @param {boolean} playlist 
	 */
	async handleVideo(video, msg, voiceChannel, playlist = false) {
		// Handles video exception
		if (video.description === 'This video is unavailable.' || video.description === 'This video is private.') {
			return;
		}

		// Creates a "song"
		video = await this.client.youtube.getVideoByID(video.id);
		const song = new Song(video, msg);

		// Joins channel and handles all exceptions
		try {
			// Creates connection if not existent.
			if (!this.connection) {
				this.text = msg.channel;
				this.voice = voiceChannel;
				this.playing = true;
				await this.join();

				this.client.log['audioStreamConnected'](msg);

				this.connection.on('disconnect', () => {
					this.end();
					this.client.log['audioStreamDisconnected'](msg);
				});
			}

			this.songs.push(song);

			if (!playlist) {
				this.client.sendNotification('', 'success', {
					'channel': this.text, 'member': song.requestedBy
				}, [
					{
						name: "Duration",
						value: `\`${this.timeToString(song.duration)}\``,
						inline: true
					},
					{
						name: "Time Until Played",
						value: `\`${this.timeToString(this.songs.length == 1 ? 0 : this.totalTime - song.duration)}\``,
						inline: true
					},
					{
						name: "Requested By",
						value: `\`${msg.member.displayName}\``
					}
				], 'Added to queue', {
					title: song.title,
					thumbnail: { url: song.thumbnail },
					url: song.url
				});
			}

			// If only song in the queue, then start playing.
			if (this.songs.length == 1) this.play(this.songs[0]);
		} catch (err) {
			console.log(err);//bot.sendNotification('Could not join voice channel', 'error', msg);
		}
	}

	/**
	 * Plays the song (either from the beginning or at the seek time)
	 * @param {Song} song 
	 * @param {Number} seek 
	 */
	async play(song, seek = 0) {
		if (!song) {
			this.end();
			return;
		}

		// 1024 = 1 KB, 1024 x 1024 = 1MB. The highWaterMark determines how much of the stream will be preloaded.
		// Dedicating more memory will make streams more smoother but uses more RAM. This will however not reduce "seek" delay significantly.
		const stream = ytdl(song.url, {
			quality: 'highestaudio', highWaterMark: 1024 * 1024 * 2
		});

		const dispatcher = this.connection.play(stream, { seek: seek });

		dispatcher.on('start', () => {
			// Creates false start time for the song to keep queue time consistent
			if (seek !== 0) song.startTime = Date.now() - (seek * 1000);
			else song.startTime = Date.now();
		})

		dispatcher.on('finish', () => {
			if (this.seeking) {
				this.seeking = false;
				return;
			}

			// Plays the next song (if looped, the queue will remian unchanged and continue playing the first item)
			if (!this.looping) this.songs.shift();
			this.play(this.songs[0]);
		});

		dispatcher.on('error', error => console.error(error));
		dispatcher.setVolumeLogarithmic(this._volume / 5);

		bot.sendNotification(`🎶 Start playing: **${song.title}**`, 'success', {
			'channel': this.text, 'member': song.requestedBy
		});
	}


	async playFile(msg, voiceChannel, fileName, guildCommand) {

		function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		// Prevents soundboard overriding.
		if (this.usingSB) {
			return;
		}

		// Ends the music queue if currently in use. No other music control commands will work
		//  with using the soundboard (since the music queue is considered not in use)
		if (this.inUse) {
			this.end();
			this.usingSB = true;

			// Prevents errors caused by instantly leaving and joining a channel
			// 500ms is an arbitrary amount of time, just ensure it is not too close to 0.
			await sleep(500);
		}

		const connection = await voiceChannel.join();

		if (!connection) {
			this.client.sendNotification('Cannot join this voice channel', 'error', msg);
			return;
		}

		var subdirectory = ''
		if (guildCommand) {
			subdirectory = voiceChannel.guild.id + '/';
		}

		const dispatcher = connection.play(`${__dirname}/soundboard/${subdirectory}${fileName}.mp3`);

		// Handles disconnection or any other reason that the connection stops.
		connection.on('disconnect', () => {
			this.usingSB = false;
		})

		// Leaves voice channel after the defined delay so o that the soundboard effect does not cut abruptly
		dispatcher.on('finish', async function () {
			const SBDelay = 500; // ms
			await sleep(SBDelay);

			voiceChannel.leave();
			this.usingSB = false;
		});
	}
}

class Song {
	constructor(video, msg) {
		this.id = video.id;
		this.title = Discord.Util.escapeMarkdown(video.title);
		this.url = `https://www.youtube.com/watch?v=${video.id}`;
		this.thumbnail = video.thumbnails.default.url;
		this.duration = this.calculateSongDuration(video.raw.contentDetails.duration);
		this.startTime = -1; // Song has not started yet
		this.requestedBy = msg.member;
	}

	/**
	 * Converts time string into epoch time
	 * @param {String} duration 
	 */
	calculateSongDuration(duration) {
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
}

//#endregion
//#region  ---------------------	Setup		---------------------

const config = JSON.parse(fs.readFileSync(`${__dirname}/settings.json`));
const bot = new Bot({ autoReconnect: true }, config);

const consoleListener = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

//#endregion
//#region  ---------------------	Handlers	---------------------

bot.on('ready', () => {
	bot.start();
	bot.user.setActivity(`over ${bot.guilds.cache.array().length} servers...`, { type: 'WATCHING' });

	const startuptime = Date.now() - startTime;
	console.log(`Ready to begin! Serving in ${bot.guilds.cache.array().length} servers. Startup time: ${startuptime}ms`);
});

bot.on('message', msg => {
	const guild = bot.getGuild(msg.guild);

	if (msg.author.id !== bot.ID && guild.validMessage(msg)) {

		const command = guild.extractCommand(msg);

		if (bot.commandDict[command]) {
			// Logs guild, author, and message if enabled
			if (LOGGING) bot.log['commandMsg'](msg, command);

			// Runs the command
			bot.runCommand(command, guild, msg);
		}
		// Seperate condition for guild soundboards.
		else if (guild.hasSoundboard(command)) {
			// Logs guild, author, and message if enabled
			if (LOGGING) bot.log['commandMsg'](msg, command);

			// Runs the command
			guild.soundboard[command].main(bot, guild, msg);
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
	bot.getGuild(guild); // Initializes a new guild
	if (LOGGING) console.log(`New guild: ${guild.name}`);
})

bot.login(bot.TOKEN);

consoleListener.on('line', function (input) {
	if (input === 'stop') {
		console.log('Destroying bot and exiting application...');
		bot.destroy();
		process.exit(0);
	}
	else if (input.startsWith('reload')) {
		let name = input.replace('reload', '').trimLeft();

		// Only load command if it was successfully unloaded.
		if (bot.unloadCommand(name))
			if (bot.loadCommand(name))
				console.log('Command successfully reloaded');
			else console.log('Could not load that command during reload');
		else console.log('Could not unload that command during reload');
	}
	else if (input.startsWith('unload')) {
		let name = input.replace('unload', '').trimLeft();

		if (bot.unloadCommand(name))
			console.log('Command successfully unloaded');
		else console.log('Could not unload that command');
	}
	else if (input.startsWith('load')) {
		let name = input.replace('load', '').trimLeft();

		if (bot.loadCommand(name))
			console.log('Command successfully loaded');
		else console.log('Could not load that command');
	}
});

//#endregion