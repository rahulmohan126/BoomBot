const Discord = require('discord.js');
const YouTube = require('simple-youtube-api');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');

const Guild = require("./guild");
const Command = require("./command");

module.exports = class Bot extends Discord.Client {
	constructor(options, config, cookies) {
		super(options);

		this.START_TIME = Date.now();

		this.ID = config.BOTID;
		this.OWNERID = config.OWNERID;
		this.PREFIX = config.PREFIX;
		this.TOKEN = config.TOKEN;
		this.GOOGLE_API_KEY = config.GOOGLE_API_KEY;
		this.PROXY = config.PROXY;

		this.COLORS = {
			DEFAULT: 0x351C75,
			SUCCESS: 0x66bb69,
			ERROR: 0xEF5250,
			INFO: 0x03A8F4
		}
		
		this.cookies = cookies;
		this.buildAgent(this.PROXY);

		this.youtube = new YouTube(this.GOOGLE_API_KEY);
		this.database = new Map();
		this.commands = [];

		// This dictionary redirects to commands (including aliases)
		this.commandDict = {}

		this.log = {
			'audioStreamDisconnected': function (g) {
				console.table({
					Time: { Value: new Date().toLocaleString() },
					Item: { Value: 'AudioStream' },
					Status: { Value: 'Stream disconnected' },
					Guild: { Value: g.name, Id: g.id }
				}, ['Value', 'Id']);
			},
			'audioStreamConnected': function (msg) {
				console.table({
					Time: { Value: new Date().toLocaleString() },
					Item: { Value: 'AudioStream' },
					Status: { Value: 'Stream connected' },
					Guild: { Value: msg.guild.name, Id: msg.guild.id }
				}, ['Value', 'Id']);
			},
			'commandMsg': function (msg, command) {
				console.table({
					Time: { Value: new Date().toLocaleString() },
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
	 * Loads all the bot commands
	 */
	loadCommands() {
		var files = fs.readdirSync(`./src/commands/`);

		for (let file of files) {
			if (!file.endsWith('.js')) continue;

			let fileName = file.slice(0, -3);
			try {
				this.loadCommand(fileName);

				if (process.env.LOGGING) console.table({ Command: fileName, Status: 'Loaded' });
			} catch (error) {
				console.log(error);
				if (process.env.LOGGING) console.table({ Command: fileName, Status: 'Failed to load' });
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

					// if (process.env.LOGGING) console.table({ Command: fileName, Status: 'Loaded' });
				} catch (error) {
					console.log(error);
					if (process.env.LOGGING) console.table({ Command: fileName, Status: 'Failed to load' });
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

						if (process.env.LOGGING) console.table({ Command: subFileName, Status: 'Loaded' });
					} catch (error) {
						console.log(error);
						if (process.env.LOGGING) console.table({ Command: subFileName, Status: 'Failed to load' });
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
		const directory = `./commands/${name}.js`;

		let command = this.commands.find(command => command.name === name);

		if (!command) {
			console.error('Command not found');
			return false;
		}
		else if (command.soundboard) {
			console.error('Soundboard noises cannot be reloaded');
			return false;
		}

		// Removes the command from the list
		this.commands = this.commands.filter(command => command.name !== name);

		delete this.commandDict[name];

		// Deletes the command from the dict
		if (command.aliases !== undefined) {
			command.aliases.forEach(alias => {
				delete this.commandDict[alias];
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
	 * Sends a embed notification from the bot
	 */
	sendNotification(info, code, msg, fields = [], header = null, other = {}) {
		let includedFiles = [];
		var color;

		if (code === 'success') color = this.COLORS.SUCCESS;
		else if (code === 'error') color = this.COLORS.ERROR;
		else if (code === 'info') color = this.COLORS.INFO;
		else color = this.COLORS.DEFAULT;

		let embed = {
			color: color,
			timestamp: new Date(),
			fields: fields,
		};

		if (info !== '') {
			embed.description = info;
		}

		if (header && msg.member) {
			includedFiles = ['./icon.jpg'];

			embed.author = {
				name: header,
				iconURL: 'attachment://icon.jpg'
			}

			embed.footer = {
				text: msg.member.displayName,
				iconURL: msg.member.user.displayAvatarURL()
			}
		}
		else if (msg.member) {
			embed.footer = {
				name: msg.member.displayName,
				iconURL: msg.member.user.displayAvatarURL()
			}
		}

		if (other) {
			Object.assign(embed, other);
		}

		return msg.channel.send({ embeds: [embed], files: includedFiles });
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
		this.loadSoundboard();
	}


	updateConfig() {
		const config = {
			BOTID: this.ID,
			OWNERID: this.OWNERID,
			PREFIX: this.PREFIX,
			TOKEN: this.TOKEN,
			GOOGLE_API_KEY: this.GOOGLE_API_KEY,
			PROXY: this.PROXY
		}

		fs.writeFileSync("./settings.json", JSON.stringify(config, null, 2));
	}

	buildAgent(newProxy) {
		this.agent = (newProxy === null) ? ytdl.createAgent(this.cookies) : ytdl.createProxyAgent(newProxy, this.cookies);
		this.PROXY = newProxy;
		this.updateConfig();	
	}
}