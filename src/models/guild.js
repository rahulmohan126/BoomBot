const Discord = require('discord.js');
const MusicQueue = require("./queue");

module.exports = class Guild {
	constructor(client, data, info = {
		prefix: client.PREFIX,
		textChannel: '',
		voiceChannel: '',
		dj: '',
		instant: true
	}) {
		Object.assign(this, data);

		this.client = client;

		this.prefix = info.prefix;
		this.textChannel = info.textChannel;
		this.voiceChannel = info.voiceChannel;
		this.dj = info.dj;
		this.instant = info.instant;

		this.soundboard = {};

		this.queue = new MusicQueue(this.client, this);
	}

	/**
	 * Checks the command permissions of the member
	 * @param {Discord.GuildMemberResolvable} memberResolvable 
	 */
	checkPerms(memberResolvable) {
		// 0 => All perms
		// 1 => Most perms
		// 2 => Basic perms

		var member = this.members.resolve(memberResolvable);

		if (this.ownerID === member.id || this.client.OWNERID === member.id) {
			return 0;
		}
		else if (member.permissions.has('ADMINISTRATOR') || (this.dj !== '' && member.roles.cache.has(this.dj))) {
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
		return this.textChannel === '' ? true : this.textChannel === channelID;
	}

	/**
	 * Checks if the voice channel is the one permitted by the guild
	 * @param {Discord.Snowflake} channelID
	 */
	checkVoiceChannelByID(channelID) {
		return this.voiceChannel === '' ? true : this.voiceChannel === channelID;
	}

	/**
	 * Checks the validity of a message
	 * @param {Discord.Message} msg 
	 */
	validMessage(msg) {
		return (this.checkTextChannelByID(msg.channel.id) ||
			this.checkPerms(msg.member) < 2) && (msg.content.startsWith(this.prefix) || msg.content.startsWith(`<@${this.client.ID}>`));
	}

	/**
	 * Removed the prefix or bot mention from the start of the message
	 * @param {Discord.Message} msg 
	 */
	extractCommand(msg) {
		if (msg.content.startsWith(this.prefix)) {
			msg.content = msg.content.replace(this.prefix, '').trimStart();
		}
		else if (msg.content.startsWith(`<@${this.client.ID}>`)) {
			msg.content = msg.content.replace(`<@${this.client.ID}>`, '').trimStart();
		}

		const command = msg.content.split(' ')[0].toLowerCase();
		msg.content = msg.content.replace(command, '').trimStart();

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