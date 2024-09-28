module.exports = class Command {
	constructor(commandName, command) {
		this.name = commandName;
		this.main = command.main;
		this.aliases = command.aliases;
		this.usage = command.usage;
		this.help = command.help;
		this.module = command.module;

		// Whether to display it in the HELP command.
		this.hide = command.hide ? true : false;

		// If it is a soundboard effect or not
		this.soundboard = command.soundboard ? true : false;
	}
}