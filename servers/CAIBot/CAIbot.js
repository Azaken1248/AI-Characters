const { Client, GatewayIntentBits, Collection, WebhookClient } = require('discord.js');
const fs = require('fs');
const CAINode = require('cainode');

const { filterMessage } = require('./utils/stringUtils.js');
const { loadWebhooks } = require('./utils/webhookUtils.js');

require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
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
        await clientCAI.login(process.env.CAI_AUTH_TOKEN);
        console.log('Logged in to CAINode successfully.');

        const existingWebhooks = await loadWebhooks(clientCAI);

        for (const channelId in existingWebhooks) {
            const { id, token, characterID } = existingWebhooks[channelId];
            const webhook = new WebhookClient({ id, token });

            if (characterID) {
                try {
                    await clientCAI.character.connect(characterID);
                    console.log(`Connected to character ${characterID} successfully.`);
                } catch (error) {
                    console.error(`Failed to connect to character ${characterID}:`, error);
                }
            }

            client.on('messageCreate', async (msg) => {
                if (msg.webhookId && msg.webhookId === webhook.id) {
                    return;
                }

                try {
                    await clientCAI.character.send_message(`${msg.author.username}: ${msg.content.trim()}`, true, "");
                    let response = await clientCAI.character.generate_turn();
                    if (response && response.turn && response.turn.candidates && response.turn.candidates.length > 0) {
                        const responseText = response.turn.candidates[0].raw_content;
                        console.log(`Response: `, responseText);

                        await webhook.send(filterMessage(responseText));
                        console.log("Response sent:", responseText);
                    } else {
                        console.log("No response from character");
                    }
                } catch (error) {
                    console.log("Message Error: ", error);
                }
            });
        }
    } catch (error) {
        console.error('Error during bot initialization:', error);
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