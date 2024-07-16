const fs = require('fs');
const CAINode = require('cainode');

function filterMessage(message) {
    const regex = /(\*[^*]*\*)|([^*]+)/g;
    let matches = [];
    let match;
    
    while ((match = regex.exec(message)) !== null) {
        if (match[1] === undefined) {
            let cleanText = match[0].replace(/"/g, '');
            if (cleanText.trim()) {
                matches.push(cleanText.trim());
            }
        }
    }
    
    return matches.join(', ');
}

function saveWebhook(channelId, webhookData, characterID) {
    let webhooks = {};
    if (fs.existsSync('webhooks.json')) {
        webhooks = JSON.parse(fs.readFileSync('webhooks.json', 'utf8') || '{}');
    }
    webhooks[channelId] = { ...webhookData, characterID };
    fs.writeFileSync('webhooks.json', JSON.stringify(webhooks, null, 2));
}



async function loadWebhooks(clientCAI) {
    if (!fs.existsSync('webhooks.json')) {
        return {};
    }
    const webhooks = JSON.parse(fs.readFileSync('webhooks.json', 'utf8') || '{}');
    
    for (const channelId in webhooks) {
        const { characterID } = webhooks[channelId];
        if (characterID) {
            try {
                await clientCAI.character.connect(characterID);
            } catch (error) {
                console.error(`Failed to connect to character ${characterID}:`, error);
            }
        }
    }

    return webhooks;
}


module.exports = {
    name: "addCharacter",
    description: "Add AI Character To Server",
    async execute(client, message, args) {
        console.log('Received args:', args); 
        console.log('Received message:', message);

        if (!args || args.length === 0) {
            return message.reply("Please provide a character ID.");
        }

        if (!process.env.CAI_AUTH_TOKEN) {
            return message.reply("Please use `!setCAIAuth <token>` to set your token first.");
        }

        const clientCAI = new CAINode();
        const charID = args[0];

        try {
            await clientCAI.login(process.env.CAI_AUTH_TOKEN);
            const characterDetails = await clientCAI.character.info(charID);

            const uname = characterDetails.character?.name || 'Unknown Name';
            const avatarFileName = characterDetails.character?.avatar_file_name;
            const pfp = avatarFileName 
                ? `https://characterai.io/i/80/static/avatars/${avatarFileName}`
                : '';

            message.reply(`${pfp}\n${uname}`);

            await clientCAI.character.connect(charID);

            const channel = message.channel;
            let webhook;

            const existingWebhooks = await loadWebhooks(clientCAI);
            if (existingWebhooks[channel.id]) {
                webhook = new WebhookClient({ id: existingWebhooks[channel.id].id, token: existingWebhooks[channel.id].token });
            } else {
                try {
                    webhook = await channel.createWebhook({
                        name: uname,
                        avatar: pfp,
                        reason: "",
                    });
                    saveWebhook(channel.id, { id: webhook.id, token: webhook.token }, charID);
                    console.log("Created BOT Successfully");
                } catch (error) {
                    console.error("Failed to create webhook:", error);
                    return message.reply("Failed to create webhook.");
                }
            }

            client.on('messageCreate', async (msg) => {
                if ((msg.webhookId && msg.webhookId === webhook.id) && !(msg.content.startsWith("!"))) {
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

        } catch (error) {
            console.error("Error in addCharacter command:", error);
            message.reply("Invalid character ID.");
        }
    },
};

