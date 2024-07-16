const CAINode = require('cainode');
require('dotenv').config();

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

            try {
                webhook = await channel.createWebhook({
                    name: uname,
                    reason: "",
                });
                console.log("Created BOT Successfully");
            } catch (error) {
                console.error("Failed to create webhook:", error);
                return message.reply("Failed to create webhook.");
            }

            // Message event listener
            client.on('messageCreate', async (msg) => {
                // Check if the message is from the bot or the webhook itself
                if ((msg.webhookId && msg.webhookId === webhook.id) && !(msg.content.startsWith("!"))) {
                    return;
                }

                try {
                    // Send message to the CAI character
                    await clientCAI.character.send_message(`${msg.author.username}: ${msg.content.trim()}`, true, "");
                    let response = await clientCAI.character.generate_turn();
                    if (response && response.turn && response.turn.candidates && response.turn.candidates.length > 0) {
                        const responseText = response.turn.candidates[0].raw_content;
                        console.log(`Response: `, responseText);

                        // Send the response from the character back to the channel via the webhook
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
