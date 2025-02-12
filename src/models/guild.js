const Discord = require('discord.js');

const Bot = require('./bot');
const MusicQueue = require('./queue');

module.exports = class Guild {
	/**
	 * 
	 * @param {Bot} client 
	 * @param {Discord.Guild} data 
	 * @param {Object} info 
	 */
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