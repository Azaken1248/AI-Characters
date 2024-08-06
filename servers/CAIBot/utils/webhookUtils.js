const CharacterModel = require('../storage/schema'); 
const connectDB = require('../storage/connection');
const { handleMessageCreate } = require('../utils/concurrencyUtils');

connectDB();

async function saveWebhook(webhookName, webhookData, characterID, flag, serverID, channelID, listenerID) {
    try {
        let webhook = await CharacterModel.findOne({ username: webhookName });

        if (webhook) {
            webhook = Object.assign(webhook, webhookData, { characterID, flag, serverID, channelID, listenerID });
        } else {
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
            const { username, id, token, characterID, flag, serverID, channelID, listenerID } = webhook;

            if (characterID) {
                try {
                    await clientCAI.login(process.env.CAI_AUTH_TOKEN);
                    if (clientCAI?.character?.connect) {
                        await clientCAI.character.connect(characterID);
                    } else {
                        console.error('clientCAI.character.connect is not defined');
                    }
                } catch (error) {
                    console.error(`Failed to connect to character ${characterID}:`, error);
                }
            }

            const boundHandleMessageCreate = (msg) => handleMessageCreate(msg, flag, clientCAI, webhook);

            if (!client.webhookListeners) {
                client.webhookListeners = new Map();
            }

            if (client.webhookListeners.has(listenerID)) {
                const oldListener = client.webhookListeners.get(listenerID);
                client.removeListener('messageCreate', oldListener);
            }

            client.webhookListeners.set(listenerID, boundHandleMessageCreate);
            client.on('messageCreate', boundHandleMessageCreate);
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
