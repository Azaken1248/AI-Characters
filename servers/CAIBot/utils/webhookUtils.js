const mongoose = require('mongoose');
const CharacterModel = require('../storage/schema'); // Adjust the path as needed
const connectDB = require('../storage/connection');

connectDB();

async function saveWebhook(webhookName, webhookData, characterID, flag, serverID, channelID, listenerID) {
    try {
        let webhook = await CharacterModel.findOne({ username: webhookName });

        if (webhook) {
            // Update existing webhook
            webhook = Object.assign(webhook, webhookData, { characterID, flag, serverID, channelID, listenerID });
        } else {
            // Create a new webhook
            webhook = new CharacterModel({
                username: webhookName,
                ...webhookData,
                characterID,
                flag,
                serverID,
                channelID,
                listenerID
            });
        }

        await webhook.save();
        console.log('Webhook saved:', webhook);
    } catch (error) {
        console.error('Error saving webhook:', error);
    }
}

async function loadWebhooks(client, clientCAI) {
    try {
        const webhooks = await CharacterModel.find({});

        for (const webhook of webhooks) {
            console.log(typeof(webhook["characterID"]));
            const { characterID, serverID, channelID, listenerID, flag, id, token } = webhook;

            if (characterID) {
                try {
                    await clientCAI.character.connect(webhook["characterID"]);
                } catch (error) {
                    console.error(`Failed to connect to character ${characterID}:`, error);
                }
            }

            const handleMessageCreate = async (msg) => {
                let check = false;

                if (flag === '-c') {
                    check = msg.author.bot;
                } else if (flag === '-f') {
                    check = msg.webhookId && msg.webhookId === id;
                }

                if (check || msg.content.startsWith("!")) {
                    return;
                }

                const token = ++currentToken;
                messageQueue.push({ msg, token });

                if (!processing) {
                    processQueue(clientCAI, webhook);
                }
            };

            if (!client.webhookListeners) {
                client.webhookListeners = new Map();
            }

            if (client.webhookListeners.has(listenerID)) {
                const oldListener = client.webhookListeners.get(listenerID);
                client.removeListener('messageCreate', oldListener);
            }

            client.webhookListeners.set(listenerID, handleMessageCreate);
            client.on('messageCreate', handleMessageCreate);
        }

        return webhooks;
    } catch (error) {
        console.error('Error loading webhooks:', error);
        return [];
    }
}

async function removeWebhook(client, identifier) {
    try {
        const webhook = await CharacterModel.findOneAndDelete({
            $or: [{ id: identifier }, { username: identifier }]
        });

        if (webhook) {
            const { listenerID } = webhook;
            if (listenerID && client.webhookListeners.has(listenerID)) {
                const oldListener = client.webhookListeners.get(listenerID);
                client.removeListener('messageCreate', oldListener);
                client.webhookListeners.delete(listenerID);
            }

            console.log(`Webhook with ${webhook.id ? 'ID' : 'name'} '${identifier}' removed.`);
            return webhook.id;
        } else {
            console.error(`Webhook with identifier '${identifier}' does not exist.`);
            return null;
        }
    } catch (error) {
        console.error('Error removing webhook:', error);
        return null;
    }
}

module.exports = {
    saveWebhook,
    loadWebhooks,
    removeWebhook
};
