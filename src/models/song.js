const Discord = require('discord.js');
const YouTube = require('simple-youtube-api');

module.exports = class Song {
	/**
	 * @param {YouTube.Video} video 
	 * @param {Discord.ChatInputCommandInteraction} int 
	 */
	constructor(video, int) {
		/**
		 * @type {String}
		 */
		this.id = video.id;
		/**
		 * @type {String}
		 */
		this.title = Discord.escapeMarkdown(video.title);
		/**
		 * @type {String}
		 */
		this.url = `https://www.youtube.com/watch?v=${video.id}`;
		/**
		 * @type {String}
		 */
		this.thumbnail = video.thumbnails.default.url;
		/**
		 * @type {Number}
		 */
		this.duration = this.calculateSongDuration(video.raw.contentDetails.duration);
		/**
		 * @type {String}
		 */
		this.durationStr = this.generateDurationStr();
		/**
		 * @type {Discord.GuildMember}
		 */
		this.requestedBy = int.member;
	}

	/**
	 * Converts time string into epoch time
	 * @param {String} duration 
	 */
	calculateSongDuration(duration) {
		const VALUE_MAP = {
			'S': 1,
			'M': 60,
			'H': 3600,
			'D': 86400
		};
		
		var time = 0;
		const components = duration.slice(2).split(/(.+?[A-Z])/g);
		components.forEach(comp => {
			if (comp === '') return;
			let number = comp.slice(0, comp.length - 1);
			let type = comp[comp.length - 1]
			time += number * VALUE_MAP[type];
		});

		return time * 1000;
	};

	/**
	 * @returns {String} String format of the song duration
	 */
	generateDurationStr() {
		var returnStr = new Date(this.duration).toUTCString().split(' ')[4];

		// Removes hour section if not necessary
		if (returnStr.startsWith('00:')) {
			return returnStr.substring(3);
		}

		return returnStr;
	}
}