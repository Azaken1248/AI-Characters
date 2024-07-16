const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    console.log(`Command loaded: ${command.name}`);
}

console.log(client.commands);

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', async (message) => {
    // Ignore messages that do not start with '!' or from bots
    if (!message.content.startsWith('!') || message.author.bot) return;

    // Extract command name and arguments
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift()

    console.log(`Received command: ${commandName}`);

    if (!client.commands.has(commandName)) {
        console.log(`Command not found: ${commandName}`);
        return;
    }

    const command = client.commands.get(commandName);

    try {
        await command.execute(client, message, args);
        console.log(`Executed command: ${commandName}`);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        message.reply('There was an error trying to execute that command!');
    }
});


client.login(process.env.DISCORD_TOKEN);
