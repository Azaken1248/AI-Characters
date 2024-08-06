
const { EmbedBuilder } = require('discord.js');
const CAINode = require('cainode');
const { saveWebhook } = require('../utils/webhookUtils.js');
const { handleMessageCreate } = require('../utils/concurrencyUtils.js');

module.exports = {
    name: "addCharacter",
    description: "Add AI Character To Server",
    async execute(clientCAI, client, message, args) {
        console.log('Received args:', args);
        console.log('Received message:', message);

        if (!args || args.length === 0) {
            return message.reply("Please provide a character ID.");
        }

        if (!process.env.CAI_AUTH_TOKEN) {
            return message.reply("Please use `!setCAIAuth <token>` to set your token first.");
        }

        const charID = args[0];
        const flag = args[1];
        const node = new CAINode();

        try {
            await node.login(process.env.CAI_AUTH_TOKEN);
            const characterDetails = await node.character.info(charID);

            const uname = characterDetails.character?.name || 'Unknown Name';
            const avatarFileName = characterDetails.character?.avatar_file_name;
            const pfp = avatarFileName 
                ? `https://characterai.io/i/80/static/avatars/${avatarFileName}`
                : '';
            const caiLink = `https://character.ai/chat/${characterDetails.character.external_id}`

            const embed = new EmbedBuilder().setColor('Yellow').setTitle(`${uname}`).setDescription(characterDetails.character.description).setThumbnail(pfp).addFields({ name: 'CAI Link', value: `[${uname}](${caiLink})`, inline: true }); 

            await node.character.connect(charID);

            const channel = message.channel;
            const serverID = message.guild.id;
            const channelID = message.channelId;
            const listenerID = `${serverID}-${channelID}-${charID}`;

            let webhook;
            let status = {text: "Failed To Create Webhook!", iconURL: "https://i.ibb.co/vznjJH0/cross.png"};
            try {
                console.log(`Creating new webhook for channel ${channel.id}`);
                webhook = await channel.createWebhook({
                    name: uname,
                    avatar: pfp,
                    reason: "",
                });
                console.log(`Webhook created: ${webhook.id}`);
                await saveWebhook(webhook.name, { id: webhook.id, token: webhook.token }, charID, flag, serverID, channelID, listenerID);
                console.log("Saved webhook successfully");
                status = {text: "Saved webhook successfully!", iconURL: "https://i.ibb.co/NVrHCky/tick.png"};
            } catch (error) {
                console.error("Failed to create webhook:", error);
            }

            embed.setFooter(status);
            message.reply({ embeds: [embed] });

            if (!client.webhookListeners) {
                client.webhookListeners = new Map();
            }

            if (client.webhookListeners.has(listenerID)) {
                const oldListener = client.webhookListeners.get(listenerID);
                client.removeListener('messageCreate', oldListener);
            }

            const boundHandleMessageCreate = (msg) => handleMessageCreate(msg, flag, node, webhook);
            client.webhookListeners.set(listenerID, boundHandleMessageCreate);

            client.on('messageCreate', boundHandleMessageCreate);

        } catch (error) {
            console.error("Error in addCharacter command:", error);
            message.reply("Invalid character ID.");
        }
    },
};
