'use strict';
const startTime = Date.now();
//#region  ---------------------	Packages	---------------------
const Discord = require('discord.js');
const YouTube = require('simple-youtube-api');
const fs = require('fs');
const ytdl = require('ytdl-core');
const readline = require('readline');
var bot = new Discord.Client({autoReconnect: true});
//#endregion
//#region  ---------------------	  Bot		---------------------

// Required
const config = JSON.parse(fs.readFileSync(__dirname+'/settings.json'));
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
const youtube = new YouTube(bot.GOOGLE_API_KEY);
bot.start = startTime;
bot.db = JSON.parse(fs.readFileSync(__dirname+'/guild.json'));
bot.queue = new Map();
bot.DELETE_COMMANDS = false;

// Functions
bot.sendNotification = function(info, code, msg) {
	var icolor;

	if(code === 'success') icolor = bot.SUCCESS_COLOR;
	else if(code === 'error') icolor = bot.ERROR_COLOR;
	else if(code == 'info') icolor = bot.INFO_COLOR;
	else icolor = bot.COLOR;

	let embed = {
		color: icolor,
		description: info
	}
	msg.channel.send('', {embed});
}

bot.durationMS = function(duration) {
	var time = 0;
	if (duration.years != 0) {
		time += (31536000*duration.years);
	}
	if (duration.months != 0) {
		time += (2628000*duration.months);
	}
	if (duration.weeks != 0) {
		time += (604800*duration.weeks);
	}
	if (duration.days != 0) {
		time += (86400*duration.days);
	}
	if (duration.hours != 0) {
		time += (3600*duration.hours);
	}
	if (duration.minutes != 0) {
		time += (60*duration.minutes);
	}
	if (duration.seconds != 0) {
		time += duration.seconds;
	}
	return (time*1000)
}

bot.timeToString = function(ms) {
	totalTime = ms / 1000;
	var timeStr = '';
	if (totalTime > 3600) {
		timeStr += Math.floor(totalTime/3600) + ':';
		totalTime = totalTime % 3600;
	}
	if (totalTime > 60) {
		timeStr += Math.floor(totalTime/60) + ':';
		totalTime = totalTime % 60;
	}
	if (totalTime > 0) {
		timeStr += totalTime;
	}
	return timeStr;
}

bot.timeToSong = function(serverMap) {
	var totalTime = serverMap.songs[0].duration - (Date.now() - serverMap.songs[0].start);
	for (var i=1; i < serverMap.songs.length-1; i++) {
		totalTime += serverMap.songs[i].duration;
	}
	return timeToString(totalTime);
}

bot.handleVideo = async function(video, msg, voiceChannel, playlist = false) {
	const serverQueue = bot.queue.get(msg.guild.id);
	const song = {
        id: video.id,
		title: Discord.Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`,
		thumbnail: video.thumbnails.default.url,
		duration: video.duration,
		start: 0
    };
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		bot.queue.set(msg.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

		try {
            var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			queueConstruct.songs[0] = bot.play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			bot.queue.delete(msg.guild.id);
			return msg.channel.send(`I could not join the voice channel: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		if (playlist) return undefined;
		else return msg.channel.send(`✅ **${song.title}** has been added to the queue! It will begin playing in ${bot.timeToSong(serverQueue)}`);
	}
	return undefined;
}

bot.play = function(guild, song) {
	const serverQueue = bot.queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		bot.queue.delete(guild.id);
		return;
    }

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') serverQueue.textChannel('Sorry, slow network connection...');
			else console.log(reason);
            serverQueue.songs.shift();
			song = bot.play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
	serverQueue.textChannel.send(`🎶 Start playing: **${song.title}**`);
	song.start = Date.now();
	return song;
}

bot.saveConfig = function() {
	const fs = require('fs');
    fs.writeFileSync(__dirname+'/guild.json', JSON.stringify(bot.db, null, 4));
}
//#endregion
//#region  ---------------------	Commands	---------------------

// Non-file commands
var commands = {};

commands.help = {};
commands.help.args = '';
commands.help.help = '';
commands.help.hide = true;
commands.help.main = function(bot, msg) {
	if (msg.content.split(' ').length < 2) {
		var cmds = [];

		for (let command in commands) {
			if (!commands[command].hide) {
				cmds.push(command);
			}
		}
		cmds = cmds.join(', ');

		let embed = {
			color: bot.INFO_COLOR,
			description: 'Bot prefix: '+bot.db[msg.guild.id]['prefix'],
			fields: [
				{
				name: 'Commands: ',
				value: cmds,
				inline: true
				}
			],
			footer: {
				icon_url: bot.user.avatarURL,
				text: bot.user.username
			}
		}
		msg.channel.send('', {embed});
	}
	else {
		let command = msg.content.split(' ')[1];
		if (commands[command]) {
			let embed = {
				color: bot.INFO_COLOR,
				description: 'Bot prefix: '+bot.db[msg.guild.id]['prefix'],
				fields: [
					{
					name: command,
					value: commands[command].help,
					}
				],
				footer: {
					icon_url: bot.user.avatarURL,
					text: bot.user.username
				}
			}
			msg.channel.send('', {embed});
		}
		else {
			bot.sendNotification('That command does not exist', 'error', msg);
		}
	}
}

commands.reload = {};
commands.reload.args = '';
commands.reload.help = '';
commands.reload.hide = true;
commands.reload.main = function(bot, msg) {
	let command = msg.content.split(' ')[1];
    if (msg.author.id == bot.OWNERID){
        try {
            if (commands[command]) {
                var directory = __dirname+'/commands/'+command+'.js';
                delete commands[command];
                delete require.cache[directory];
                commands[command] = require(directory);
                bot.sendNotification('Reloaded ' + command + '.js successfully.', 'success', msg);
				if (bot.DETAILED_LOGGING) console.log('Reloaded ' + file);
            }
        }
        catch(err){
            bot.sendNotification('Command not found', 'error', msg);
        }
    }
    else {
		bot.sendNotification('You do not have permission to use this command.', 'error', msg);
	}
}

// Load commands
var loadCommands = function() {
	var files = fs.readdirSync(__dirname+'/commands/');
    for (let file of files) {
        if (file.endsWith('.js')) {
            commands[file.slice(0, -3)] = require(__dirname+'/commands/'+file);
            if (bot.DETAILED_LOGGING) console.log('Loaded ' + file.slice(0, -3));
        }
    }
    console.log('———— All Commands Loaded! ————');
}

//#endregion
//#region  ---------------------    Functions   ---------------------

var checkGuilds = function() {
	for (var i = 0; i < bot.guilds.array().length; i++) {
        var id = bot.guilds.array()[i]['id'];
		if (!bot.db[id]) {
			var newServer = '{"prefix":".", "channels":{"text":[],"voice":[]}}'
			bot.db[id] = JSON.parse(newServer);
		}
	}
    bot.saveConfig();
}

var commandListener = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

var textAllowed = function(msg) {
    let guildChannels = bot.db[msg.guild.id].channels.text;
	console.log(JSON.stringify(guildChannels));
	if (guildChannels.length == 0) return true;
    else {
		if (guildChannels.includes(msg.channel.id)) return true;
		else if (msg.guild.ownerID === msg.author.id) return true;
		else return false;
    }
}

//#endregion
//#region  ---------------------	Handlers	---------------------

bot.on('ready', () => {
    bot.user.setStatus('online', '');
	loadCommands();
    checkGuilds();
    var startuptime = Date.now() - startTime;
    console.log('Ready to begin! Serving in ' + bot.guilds.array().length + ' servers. Time: '+startuptime+'ms');
});

bot.on('message', msg => {
    var guildID = msg.guild.id;
	if (!(msg.author.id === bot.ID)) {
	    if (msg.content.startsWith(bot.db[guildID]['prefix'])) {
	        if (textAllowed(msg)) {
	            var command = msg.content.split(bot.db[guildID]['prefix'])[1].split(' ')[0];
	            if (commands[command]) {
	                console.log(msg.member.id+' in '+msg.guild.id+': '+msg.content);
	                if (command === 'play') commands[command].main(bot, msg, youtube);
	                else commands[command].main(bot, msg);
	            }
	        }
	    }
	}
});

bot.on('error', (err) => {
    console.log('————— BIG ERROR —————');
    console.log(err);
    console.log('——— END BIG ERROR ———');
});

bot.on('disconnected', () => {
	console.log('Disconnected!');
});

bot.login(bot.TOKEN);

commandListener.on('line', function (line) {
	if (line === 'stop') {
        bot.destroy();
        process.exit(0);
    }
});
//#endregion
