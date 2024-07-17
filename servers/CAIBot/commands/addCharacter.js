const CAINode = require('cainode');

const { filterMessage } = require('../utils/stringUtils.js');
const { saveWebhook } = require('../utils/webhookUtils.js');

module.exports = {
    name: "addCharacter",
    description: "Add AI Character To Server",
    async execute(clientCAI,client, message, args) {
        console.log('Received args:', args);
        console.log('Received message:', message);

        if (!args || args.length === 0) {
            return message.reply("Please provide a character ID.");
        }

        if (!process.env.CAI_AUTH_TOKEN) {
            return message.reply("Please use `!setCAIAuth <token>` to set your token first.");
        }

        const charID = args[0];
        const node = new CAINode();

        try {
            await node.login(process.env.CAI_AUTH_TOKEN);
            const characterDetails = await node.character.info(charID);

            const uname = characterDetails.character?.name || 'Unknown Name';
            const avatarFileName = characterDetails.character?.avatar_file_name;
            const pfp = avatarFileName 
                ? `https://characterai.io/i/80/static/avatars/${avatarFileName}`
                : '';

            message.reply(`${pfp}\n${uname}`);

            await node.character.connect(charID);

            const channel = message.channel;

            let webhook;
            try {
                console.log(`Creating new webhook for channel ${channel.id}`);
                webhook = await channel.createWebhook({
                    name: uname,
                    avatar: pfp,
                    reason: "",
                });
                console.log(`Webhook created: ${webhook.id}`);
                saveWebhook(webhook.name, { id: webhook.id, token: webhook.token }, charID);
                console.log("Saved webhook successfully");
            } catch (error) {
                console.error("Failed to create webhook:", error);
                return message.reply("Failed to create webhook.");
            }

            const handleMessageCreate = async (msg) => {
                if ((msg.webhookId && msg.webhookId === webhook.id) || msg.content.startsWith("!")) {
                    return;
                }

                try {
                    await node.character.send_message(`${msg.author.username}: ${msg.content.trim()}`, true, "");
                    let response = await node.character.generate_turn();
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
            };

            if (!client.webhookListeners) {
                client.webhookListeners = new Map();
            }
            client.webhookListeners.set(webhook.id, handleMessageCreate);

            client.on('messageCreate', handleMessageCreate);

        } catch (error) {
            console.error("Error in addCharacter command:", error);
            message.reply("Invalid character ID.");
        }
    },
};
