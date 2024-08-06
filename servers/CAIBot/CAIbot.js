const { Client, GatewayIntentBits, Collection, WebhookClient } = require('discord.js');
const fs = require('fs');
const CAINode = require('cainode');
const { filterMessage } = require('./utils/stringUtils.js');
const { loadWebhooks } = require('./utils/webhookUtils.js');

require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
const clientCAI = new CAINode();

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    console.log(`Command loaded: ${command.name}`);
}

console.log(client.commands);

client.once('ready', async () => {
    console.log('Bot is online!');

    try {
        const existingWebhooks = await loadWebhooks(client, clientCAI);
        console.log("Loaded Webhooks: ",existingWebhooks);
    } catch (error) {
        console.error('Error Loading Webhooks:', error);
    }
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    message.channel.sendTyping();

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift();

    console.log(`Received command: ${commandName}`);

    if (!client.commands.has(commandName)) {
        console.log(`Command not found: ${commandName}`);
        return;
    }

    const command = client.commands.get(commandName);

    try {
        await command.execute(clientCAI, client, message, args);
        console.log(`Executed command: ${commandName}`);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        message.reply('There was an error trying to execute that command!');
    }
});

client.login(process.env.DISCORD_TOKEN);
