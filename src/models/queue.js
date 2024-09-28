const Discord = require('discord.js');
const DiscordVoice = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');

const Song = require("./song");

function PromiseTimeout(delayms) {
	return new Promise(function (resolve, reject) {
		setTimeout(resolve, delayms);
	});
}

module.exports = class MusicQueue {
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
			this.client.log['audioStreamDisconnected'](this.guild);
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
		if (this.songs.length === 0 && !this.nowPlaying) return 0;
		var totalTime = this.songs.reduce((acc, cur) => acc + cur.duration, 0);
		totalTime += this.nowPlaying.duration - (Date.now() - this.nowPlaying.startTime);
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
			return this.client.sendNotification('Video is private or unavailable', 'error', msg);
		}

		// Creates a "song"
		video = await this.client.youtube.getVideoByID(video.id);
		if (video.raw.contentDetails.duration === 'P0D') {
			return this.client.sendNotification('Cannot play livestreams', 'error', msg);
		}

		const song = new Song(video, msg);

		// Joins channel and handles all exceptions
		try {
			// Creates connection if not existent.
			if (!this.connection) {
				this.text = msg.channel;
				this.voice = voiceChannel;
				this.playing = true;
				this.inUse = true
				await this.join();

				this.client.log['audioStreamConnected'](msg);

				this.connection.on('disconnected', () => {
					this.end();
				});
			}

			this.songs.push(song);

			if (!playlist) {
				this.client.sendNotification('', 'success', {
					channel: this.text, member: song.requestedBy
				}, [
					{
						name: "Duration",
						value: `\`${this.timeToString(song.duration)}\``,
						inline: true
					},
					{
						name: "Time Until Played",
						value: `\`${this.timeToString(!this.nowPlaying ? 0 : (this.totalTime - song.duration))}\``,
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

			// If no song playing, play this song.
			if (!this.nowPlaying) this.play(this.songs[0]);
		} catch (err) {
			console.log(err);
			this.client.sendNotification('Could not join voice channel', 'error', msg);
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
		let resource = DiscordVoice.createAudioResource(stream, { inlineVolume: true });
		resource.volume.setVolume(0.5);
		this.player.play(resource);
		this.connection.subscribe(this.player);

		stream.on('error', () => {
			this.client.sendNotification(`Sorry, there was an error processing "${this.nowPlaying.title}", moving to the next song in the queue`, 'error', {
				'channel': this.text, 'member': song.requestedBy
			});
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

		this.client.sendNotification(`🎶 [**${song.title}**](${song.url})`, 'success', {
			'channel': this.text, 'member': song.requestedBy
		}, [], 'Started playing');
	}


	async playFile(msg, voiceChannel, fileName, guildCommand) {
		// Prevents overriding.
		if (this.inUse) {
			return;
		}

		this.inUse = true;
		this.voice = voiceChannel;
		await this.join();

		if (!this.connection) {
			this.client.sendNotification('Cannot join this voice channel', 'error', msg);
			return;
		}

		var directory = './data/soundboard';
		if (guildCommand) {
			directory += '/' + voiceChannel.guild.id;
		}

		this.player = DiscordVoice.createAudioPlayer();
		this.player.play(DiscordVoice.createAudioResource(`${directory}/${fileName}.mp3`));
		this.connection.subscribe(this.player);

		this.player.on(DiscordVoice.AudioPlayerStatus.Idle, () => {
			this.end();
		});
	}
}