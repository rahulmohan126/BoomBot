const Discord = require('discord.js');

module.exports = class Song {
	constructor(video, int) {
		this.id = video.id;
		this.title = Discord.escapeMarkdown(video.title);
		this.url = `https://www.youtube.com/watch?v=${video.id}`;
		this.thumbnail = video.thumbnails.default.url;
		this.duration = this.calculateSongDuration(video.raw.contentDetails.duration);
		this.startTime = -1; // Song has not started yet
		this.requestedBy = int.member;
	}

	/**
	 * Converts time string into epoch time
	 * @param {String} duration 
	 */
	calculateSongDuration(duration) {
		const value_map = {
			'S': 1,
			'M': 60,
			'H': 3600,
			'D': 86400
		};
		const durationComponents = duration.slice(2).split(/(.+?[A-Z])/g);

		var time = 0;

		durationComponents.forEach(element => {
			if (element !== '') {
				time += parseInt(element.slice(0, element.length - 1)) * value_map[element[element.length - 1]];
			}
		});
		return time * 1000;
	};
}