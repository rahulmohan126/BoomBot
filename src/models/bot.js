const Discord = require('discord.js');
const YouTube = require('simple-youtube-api');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');

const Guild = require('./guild');
const Command = require('./command');

module.exports = class Bot extends Discord.Client {
	constructor(startTime, options, config, cookies) {
		super(options);

		this.START_TIME = startTime;

		this.ID = config.BOTID;
		this.OWNERID = config.OWNERID;
		this.PREFIX = config.PREFIX;
		this.TOKEN = config.TOKEN;
		this.GOOGLE_API_KEY = config.GOOGLE_API_KEY;
		this.PROXY = config.PROXY;

		this.COLORS = {
			default: 0x351C75,
			success: 0x66bb69,
			error: 0xEF5250,
			info: 0x03A8F4
		}
		
		this.cookies = cookies;
		this.buildAgent(this.PROXY);

		this.youtube = new YouTube(this.GOOGLE_API_KEY);
		this.database = new Map();
		this.commands = [];

		// This dictionary redirects to commands (including aliases)
		this.commandDict = {}
	}

	/**
	 * Creates data folders if they do not exist
	 */
	initData() {
		if (!fs.existsSync('./data')) {
			fs.mkdirSync('./data');
		}

		if (!fs.existsSync('./data/guild.json')) {
			fs.writeFileSync('./data/guild.json', '{}');
		}

		if (!fs.existsSync('./data/soundboard')) {
			fs.mkdirSync('./data/soundboard');
		}
	}

	/**
	 * Loads all the guild datas
	 */
	loadGuilds() {
		let jsonInfo = JSON.parse(fs.readFileSync(`./data/guild.json`));

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
	 * Loads a command indentified by its primary name
	 * @param {String} name Command name
	 */
	loadCommand(name) {
		const directory = `../commands/${name}.js`;

		let command = new Command(name, require(directory));

		this.commands.push(command);
		this.commandDict[name] = command;

		if (command.aliases !== undefined) {
			for (let alias of command.aliases) {
				this.commandDict[alias] = command;
			}
		}

		return true;
	}

	/**
	 * Loads all the bot commands
	 */
	loadCommands() {
		var files = fs.readdirSync(`./src/commands/`);

		for (let file of files) {
			if (!file.endsWith('.js')) continue;

			let fileName = file.slice(0, -3);
			try {
				this.loadCommand(fileName);
			}
			catch (error) {
				console.log(error);
			}
		}

		console.log('———— All Commands Loaded! ————');
	}

	/**
	 * Loads all global and guild soundboard commands
	 */
	loadSoundboard() {
		var audioFiles = fs.readdirSync('./data/soundboard/');
		for (let file of audioFiles) {
			// Global soundboard files
			let fileDirectory = `./data/soundboard/${file}`;
			if (file.endsWith('.mp3')) {
				let fileName = file.slice(0, -4);
				try {
					const command = this.createSoundboardCommand(fileName);

					this.commands.push(command);
					this.commandDict[fileName] = command;
				} catch (error) {
					console.log(error);
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

						if (!guild) {
							throw new Error('No guild with that id exists');
						}
						
						guild.soundboard[subFileName] = command;
					} catch (error) {
						console.log(error);
					}
				}
			}
		}
	}

	registerCommands() {
		const commands = require('../slash');
		commands.forEach(async (cmd) => {
			await this.application.commands.create(cmd);
		});
	}

	createSoundboardCommand(fileName, guildCommand = false) {
		return new Command(fileName, {
			main: function (bot, guild, int) {
				const voiceChannel = int.member.voice.channel;

				if (voiceChannel && guild.checkVoiceChannelByID(voiceChannel.id)) {
					guild.queue.playFile(int, voiceChannel, fileName, guildCommand);
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
	 * @param {Discord.ChatInputCommandInteraction} int 
	 */
	runCommand(command, guild, int) {
		this.commandDict[command].main(this, guild, int);
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
	 * Sends a embed notification from the bot
	 * @param {String} text 
	 * @param {String} code 
	 * @param {Discord.ChatInputCommandInteraction} int 
	 * @param {Discord.TextBasedChannel?} channel 
	 */
	sendNotification(text, type, int, channel=null) {
		let embed = {
			description: text,
			color: this.COLORS[type],
			timestamp: new Date(),
		};

		/**
		 * Alternate send if there isn't a specific interaction to respond to
		 */
		if (channel) {
			return channel.send({ embeds: [embed] });
		}

		return int.reply({ embeds: [embed] });
	}

	/**
	 * 
	 * @param {String} header 
	 * @param {String|Discord.APIEmbedField[]} body 
	 * @param {String} type 
	 * @param {Discord.ChatInputCommandInteraction} int 
	 * @param {Discord.APIEmbed?} other
	 */
	sendEmbed(header, body, type, int, other = null) {
		let embed = {
			color: this.COLORS[type],
			timestamp: new Date(),
			author:  {
				name: header,
				iconURL: 'attachment://icon.jpg'
			},
			footer: {
				text: int.member.displayName,
				iconURL: int.member.user.displayAvatarURL()
			}
		};

		if (typeof(body) === 'string') {
			embed.description = body;
		}
		else {
			embed.fields = body;
		}

		Object.assign(embed, other);

		let msg = { embeds: [embed], files: ['./icon.jpg'] };

		if (!int.commandName) {
			return int.channel.send(msg);
		}

		return int.reply(msg);
	}

	/**
	 * Exports the databse in JSON format
	 */
	save() {
		let jsonDatabase = {}

		for (let guildID of this.database.keys()) {
			jsonDatabase[guildID] = this.database.get(guildID).json();
		}

		fs.writeFileSync('./data/guild.json', JSON.stringify(jsonDatabase, null, 4));
	}

	/**
	 * Initializes the bot
	 */
	start() {
		this.initData();
		this.loadGuilds();
		this.loadCommands();
		this.registerCommands();
		this.loadSoundboard();
	}

	/**
	 * Saves the current config values to file
	 */
	updateConfig() {
		const config = {
			BOTID: this.ID,
			OWNERID: this.OWNERID,
			PREFIX: this.PREFIX,
			TOKEN: this.TOKEN,
			GOOGLE_API_KEY: this.GOOGLE_API_KEY,
			PROXY: this.PROXY
		}

		fs.writeFileSync('./settings.json', JSON.stringify(config, null, 2));
	}

	/**
	 * Updates the YouTube agent to use a new proxy (or not if newProxy is null)
	 * @param {String|null} newProxy 
	 */
	buildAgent(newProxy) {
		this.agent = (newProxy === null) ? ytdl.createAgent(this.cookies) : ytdl.createProxyAgent(newProxy, this.cookies);
		this.PROXY = newProxy;
		this.updateConfig();	
	}

	onReady() {
		this.start();
		this.user.setActivity(`over ${this.guilds.cache.size} servers...`, { type: 'WATCHING' });
	
		const startuptime = Date.now() - this.START_TIME;
		console.log('ACTIVE SERVERS: ')
		this.guilds.cache.each(guild => console.log(`${guild.id} | ${guild.name}`));
	
		console.log(`\nReady to begin! Serving in ${this.guilds.cache.size} servers. Startup time: ${startuptime}ms`);
	}

	/**
	 * @param {Discord.ChatInputCommandInteraction} int
	 */
	onInteractionCreate(int) {
		if (!int.isChatInputCommand()) return;
		
		let name = int.commandName;
		if (int.options.getSubcommand(false)) {
			name += '_' + int.options.getSubcommand();
		}

		if (this.commandDict[name]) {
			const guild = this.getGuild(int.guild);
			this.runCommand(name, guild, int);
		}
	}

	/**
	 * @param {Discord.VoiceState} oldState 
	 * @param {Discord.VoiceState} newState 
	 */
	onVoiceStateUpdate(oldState, newState) {
		const guild = this.getGuild(oldState.guild);
	
		if (!guild.queue.voice || guild.queue.voice.id !== oldState.channelId) {
			return;
		}
		
		let members = newState.channel?.members;
		
		// If there was some issue getting the list of members, we can't determine if
		// the bot is the only member in the voice channel, so ignore.
		if (members === undefined) return;

		if (members.size === 1 && members.firstKey() === this.ID) {
			this.sendNotification('⏹ Music stopped since everyone left the channel.', 'info', null, guild.queue.text);
			guild.queue.end();
		}
	};

	/**
	 * 
	 * @param {Discord.Guild} guild 
	 */
	onGuildCreate(guild) {
		this.user.setActivity(`over ${this.guilds.cache.size} servers...`, { type: 'WATCHING' });
		this.getGuild(guild); // Initializes a new guild
		console.log(`New guild: ${guild.name}`);
	}

	onError(err) {
		console.error('—————————— ERROR ——————————');
		console.error(err);
		console.error('———————— END ERROR ————————');
	};
	
	onDisconnected() {
		console.error('——————— DISCONNECTED ——————');
	};

	initHandlers() {
		this.on(Discord.Events.ClientReady, this.onReady);
		this.on(Discord.Events.InteractionCreate, this.onInteractionCreate);
		this.on(Discord.Events.VoiceStateUpdate, this.onVoiceStateUpdate);
		this.on(Discord.Events.GuildCreate, this.onGuildCreate);
		this.on(Discord.Events.Error, this.onError);
		this.on(Discord.Events.ShardDisconnect, this.onDisconnected);
	}
}