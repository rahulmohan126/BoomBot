"use strict";
const startTime = Date.now();

//#region  ---------------------	Packages	---------------------
const Discord = require("discord.js");
const fs = require('fs');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const readline = require('readline');
var bot = new Discord.Client({autoReconnect: true});
//#endregion
//#region  ---------------------	  Bot		---------------------

// Required
const config = JSON.parse(fs.readFileSync(__dirname+'/settings.json'));
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
bot.queue = new Map();
bot.DELETE_COMMANDS = false;
//#endregion
//#region  ---------------------	Commands	---------------------

var commands = {};

commands.help = {};
commands.help.args = '';
commands.help.help = '';
commands.help.hide = true;
commands.help.main = function(bot, msg) {
    var cmds = '';

	for (let command in commands) {
        if (!commands[command].hide) {
			cmds += command+'&&&'
        }
    }

    cmds = cmds.split("&&&");
    cmds.pop()
    cmds = cmds.join(", ");

	let embed = {
		color: bot.INFO_COLOR,
		description: "Bot prefix: "+bot.PREFIX,
		fields: [
            {
            name: "Commands: ",
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

commands.reload = {};
commands.reload.args = '';
commands.reload.help = '';
commands.reload.hide = true;
commands.reload.main = function(bot, msg) {
    if (msg.author.id == bot.OWNERID){
        try {
            if (commands[msg.content]) {
                var directory = __dirname+'/commands/'+msg.content+'.js';
                delete commands[msg.content];
                delete require.cache[directory];
                commands[msg.content] = require(directory);
                bot.sendNotification("Reloaded " + msg.content + ".js successfully.", "success", msg);
            }
        }
        catch(err){
            console.log(err)
            msg.channel.send("Command not found");
        }
    }
    else {
		bot.sendNotification("You do not have permission to use this command.", "error", msg);
	}
}
//#endregion
//#region  ---------------------	Functions	---------------------

bot.sendNotification = function(info, type, msg) {
	var icolor;

	if(type == "success") icolor = bot.SUCCESS_COLOR;
	else if(type == "error") icolor = bot.ERROR_COLOR;
	else if(type == "info") icolor = bot.INFO_COLOR;
	else icolor = bot.COLOR;

	let embed = {
		color: icolor,
		description: info
	}
	msg.channel.send('', {embed});
}

bot.durationToSec = function(duration) {
	var time = 0;
	if (duration.weeks != 0) {
		time += (604800*duration.weeks);
	}
	if (duration.years != 0) {
		time += (31536000*duration.years);
	}
	if (duration.months != 0) {
		time += (2628000*duration.months);
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
	return time
}

bot.timeToSong = function(serverMap) {
	var currentStart = serverMap.songs[0].start;
	var currentLength = serverMap.songs[0].dur - (Date.now() - currentStart)/1000;
	var totalTime = currentLength;
	for (var i=1; i < serverMap.songs.length-1; i++) {
		totalTime = totalTime + serverMap.songs[i].dur;
	}
	totalTime = Math.floor(totalTime);
	var timeStr = "";
	if (totalTime > 3600) {
		timeStr += Math.floor(totalTime/3600) + "hrs ";
		totalTime = totalTime % 3600;
	}
	if (totalTime > 60) {
		timeStr += Math.floor(totalTime/60) + "mins ";
		totalTime = totalTime % 60;
	}
	if (totalTime > 0) {
		timeStr += totalTime + "secs ";
	}
	return timeStr
}

bot.handleVideo = async function(durSec, timeTil, play, video, msg, voiceChannel, map, playlist = false) {
	const serverQueue = map.get(msg.guild.id);
	const song = {
        id: video.id,
		title: Discord.Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`,
		thumbnail: video.thumbnails.default.url,
		dur: durSec(video.duration),
		start: Date.now()
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
		map.set(msg.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

		try {
            var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0], map);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			map.delete(msg.guild.id);
			return msg.channel.send(`I could not join the voice channel: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		if (playlist) return undefined;
		else return msg.channel.send(`✅ **${song.title}** has been added to the queue! It will begin playing in ${timeTil(serverQueue)}`);
	}
	return undefined;
}

bot.play = function(guild, song, map) {
	const serverQueue = map.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		map.delete(guild.id);
		return;
    }

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') serverQueue.textChannel('Sorry, slow network connection...');
			else console.log(reason);
            serverQueue.songs.shift();
			bot.play(guild, serverQueue.songs[0], map);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`🎶 Start playing: **${song.title}**`);
}

var loadCommands = function() {
	var folders = fs.readdirSync(__dirname+'/commands');
    var files = fs.readdirSync(__dirname+'/commands/');
    for (let file of files) {
        if (file.endsWith('.js')) {
            commands[file.slice(0, -3)] = require(__dirname+'/commands/'+file);
            if(bot.DETAILED_LOGGING) console.log("Loaded " + file);
        }
    }
    console.log("———— All Commands Loaded! ————");
}

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

//#endregion
//#region  ---------------------	Handlers	---------------------

bot.on("ready", () => {
    bot.user.setStatus("online", "");
    loadCommands();
    var startuptime = Date.now() - startTime;
    console.log('Ready to begin! Serving in ' + bot.guilds.array().length + ' servers. Time: '+startuptime+'ms');
});

bot.on("message", msg => {
    if(msg.content.startsWith(bot.PREFIX)) {
        var command = msg.content.split(bot.PREFIX)[1].split(' ')[0];
        if(commands[command]) {
            console.log(msg.member.id+' in '+msg.guild.id+': '+msg.content);
            if (command === 'play') commands[command].main(bot, msg, youtube);
            else commands[command].main(bot, msg);
        }
    };
});

bot.on('error', (err) => {
    console.log("————— BIG ERROR —————");
    console.log(err);
    console.log("——— END BIG ERROR ———");
});

bot.on("disconnected", () => {
	console.log("Disconnected!");
});

bot.login(bot.TOKEN);

rl.on('line', function (line) {
	if (line === "stop") process.exit(0);
});
//#endregion
