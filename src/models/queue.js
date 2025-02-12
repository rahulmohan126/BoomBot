const Discord = require('discord.js');
const DiscordVoice = require('@discordjs/voice');
const YouTube = require('simple-youtube-api');
const ytdl = require('@distube/ytdl-core');

const Bot = require('./bot');
const Guild = require('./guild');
const Song = require('./song');

/**
 * Sleep function that pauses the current thread by the specified time
 * @param {Number} delayMs Number of milliseconds to delay
 */
function PromiseTimeout(delayMs) {
	return new Promise(function (resolve, reject) {
		setTimeout(resolve, delayMs);
	});
}

module.exports = class MusicQueue {
	/**
	 * @param {Bot} client
	 * @param {Guild} guild 
	 */
	constructor(client, guild) {
		// Channels to send data to
		this.client = client;
		this.guild = guild;

		this.text = null;
		this.voice = null;

		// Music informaiton
		this.connection = null;
		this.player = null;
		this.songs = [];

		// Status information
		this.playing = false;
		this.looping = false;

		this.inUse = false;
		this.breakTime = null;
		this.nowPlaying = null;
	}

	/**
	 * Starts voice channel connection
	 */
	async join() {
		if (this.voice !== null) {
			this.inUse = true;
			this.connection = await DiscordVoice.joinVoiceChannel({
				channelId: this.voice.id,
				guildId: this.voice.guild.id,
				adapterCreator: this.voice.guild.voiceAdapterCreator,
			});
		}
	}

	/**
	 * Resets music queue to default settings. Except for volume, that remains the same.
	 */
	end() {
		if (this.player) this.player.stop();
		if (this.connection) {
			this.connection.destroy();
		}

		this.text = null;
		this.voice = null;

		this.connection = null;
		this.player = null;
		this.songs = [];

		this.playing = false;
		this.looping = false;

		this.inUse = false;
		this.breakTime = null;
		this.nowPlaying = null;
	}

	/**
	 * Creates async process to end the voice channel connection after
	 * 5 minutes. If breakTime is changed between when the process started and when
	 * the process is about to complete, the end is terminated (implies another song
	 * started playing while waiting).
	 */
	async delayedEnd() {
		this.inUse = false;
		this.nowPlaying = null;
		this.breakTime = Date.now();
		let temp = this.breakTime;
		await PromiseTimeout(5 * 60 * 1000);
		if (temp === this.breakTime) {
			this.end();
		}
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
		if (this.songs.length === 0 && !this.nowPlaying) {
			return 0;
		}

		var totalTime = this.songs.reduce((acc, cur) => acc + cur.duration, 0);
		totalTime += this.nowPlaying.duration - this.resource.playbackDuration;
		return totalTime;
	}

	/**
	 * 
	 * @param {YouTube.Video} video 
	 * @param {Discord.ChatInputCommandInteraction} int 
	 * @param {Discord.VoiceChannel} voiceChannel 
	 * @param {boolean} playlist 
	 */
	async handleVideo(video, int, voiceChannel, playlist = false) {
		// Handles video exception
		if (video.description === 'This video is unavailable.' || video.description === 'This video is private.') {
			return this.client.sendNotification('Video is private or unavailable', 'error', int);
		}

		// Creates a "song"
		video = await this.client.youtube.getVideoByID(video.id);
		if (video.raw.contentDetails.duration === 'P0D') {
			return this.client.sendNotification('Cannot play livestreams', 'error', int);
		}

		const song = new Song(video, int);

		// Joins channel and handles all exceptions
		try {
			// Creates connection if not existent.
			if (!this.connection) {
				this.text = int.channel;
				this.voice = voiceChannel;
				this.playing = true;
				this.inUse = true
				await this.join();

				this.connection.on('disconnected', () => {
					this.end();
				});
			}

			this.songs.push(song);

			if (!playlist) {
				this.client.sendEmbed('Added to queue', [
					{
						name: 'Duration',
						value: `\`${song.durationStr}\``,
						inline: true
					},
					{
						name: 'Time Until Played',
						value: `\`${this.timeToString(!this.nowPlaying ? 0 : (this.totalTime - song.duration))}\``,
						inline: true
					},
					{
						name: 'Requested By',
						value: `\`${int.member.displayName}\``,
						inline: true
					}
				], 'success', int, {
					title: song.title,
					thumbnail: { url: song.thumbnail },
					url: song.url
				});
			}

			// If no song playing, play this song.
			if (!this.nowPlaying) this.play(this.songs[0]);
		} catch (err) {
			console.log(err);
			this.client.sendNotification('Could not join voice channel', 'error', int);
		}
	}

	/**
	 * Plays the song
	 * @param {Song} song 
	 */
	async play(song) {
		if (!song) {
			this.delayedEnd();
			return;
		}

		this.breakTime = null;
		this.inUse = true;
		this.nowPlaying = song;
		this.songs.shift();

		const stream = ytdl(song.url, {
			agent: this.client.agent,
			filter: 'audioonly',
			quality: 'highestaudio',
			highWaterMark: 1024 * 1024 * 5
		});

		this.player = DiscordVoice.createAudioPlayer();
		this.resource = DiscordVoice.createAudioResource(stream);
		this.player.play(this.resource);
		this.connection.subscribe(this.player);

		this.player.on('error', err => {
			if (err.message.startsWith('Hostname/IP does not match')) {
				console.log(`Request via proxy blocked when using "${this.client.PROXY}"`);
			}
		})

		stream.on('error', err => {
			console.log(err);
			let errorMsg = `Sorry, there was an error processing "${this.nowPlaying.title}", moving to the next song in the queue`;
			this.client.sendNotification(errorMsg, 'error', null, this.text);
			this.looping = false;
			stream.destroy();
			this.player.stop();
			this.play(this.songs[0]);
		});

		this.connection.on('error', err => {
			console.log(err);
		});

		song.startTime = Date.now();

		this.player.on(DiscordVoice.AudioPlayerStatus.Idle, () => {
			stream.destroy();
			// Plays the next song (if looped, the queue will remian unchanged and continue playing the first item)
			if (this.looping) this.play(this.nowPlaying);
			else this.play(this.songs[0]);
		});

		this.client.sendEmbed('Started playing', `🎶 [**${song.title}**](${song.url})`, 'success', {
			'channel': this.text, 'member': song.requestedBy
		});
	}
}