module.exports = class Command {
	constructor(commandName, command) {
		this.name = commandName;
		this.main = command.main;
		this.aliases = command.aliases;
		this.usage = command.usage;
		this.help = command.help;
		this.module = command.module;
	}
}