const CharacterModel = require('../storage/schema'); 
const connectDB = require('../storage/connection');
const { handleMessageCreate } = require('../utils/concurrencyUtils');
const CAINode = require('cainode')

connectDB();

async function loadWebhooks(client, _createClientCAI = null) {
    try {
        const webhooks = await CharacterModel.find({});

        for (const webhook of webhooks) {
            const { characterID, id: webhookID } = webhook;

            const clientCAI = new CAINode();
            webhook.clientCAI = clientCAI;

            try {
                await clientCAI.login(process.env.CAI_AUTH_TOKEN);
                if (clientCAI.character.connect) {
                    await clientCAI.character.connect(characterID);
                } else {
                    console.error('clientCAI.character.connect is not defined');
                }
            } catch (error) {
                console.error(`Failed to connect to character ${characterID}:`, error);
            }

            const boundHandleMessageCreate = (msg) => handleMessageCreate(msg, webhook);

            if (!client.webhookListeners) {
                client.webhookListeners = new Map();
            }

            if (client.webhookListeners.has(webhookID)) {
                const oldListener = client.webhookListeners.get(webhookID);
                client.removeListener('messageCreate', oldListener);
            }

            client.webhookListeners.set(webhookID, boundHandleMessageCreate);
            client.on('messageCreate', boundHandleMessageCreate);
        }

        return webhooks;
    } catch (error) {
        console.error('Error loading webhooks:', error);
        return [];
    }
}


async function saveWebhook(client, webhookName, webhookData, characterID, options, serverID, channelID, listenerID) {
    try {
        let webhook = await CharacterModel.findOne({ username: webhookName });

        if (webhook) {
            webhook.id = webhookData.id;
            webhook.token = webhookData.token;
            webhook.characterID = characterID;
            webhook.options = options; 
            webhook.serverID = serverID;
            webhook.channelID = channelID;
            webhook.listenerID = listenerID;
        } else {
            webhook = new CharacterModel({
                username: webhookName,
                id: webhookData.id,
                token: webhookData.token,
                characterID,
                options, 
                serverID,
                channelID,
                listenerID
            });
        }

        await webhook.save();
        console.log('Webhook saved:', webhook);

        // === Only attach this newly saved webhook ===

        const clientCAI = new CAINode();
        webhook.clientCAI = clientCAI;

        await clientCAI.login(process.env.CAI_AUTH_TOKEN);

        if (clientCAI.character.connect) {
            await clientCAI.character.connect(characterID);
        } else {
            console.error('clientCAI.character.connect is not defined');
        }

        const boundHandleMessageCreate = (msg) => handleMessageCreate(msg, webhook);

        if (!client.webhookListeners) {
            client.webhookListeners = new Map();
        }

        if (client.webhookListeners.has(listenerID)) {
            const oldListener = client.webhookListeners.get(listenerID);
            client.removeListener('messageCreate', oldListener);
        }

        client.webhookListeners.set(listenerID, boundHandleMessageCreate);
        client.on('messageCreate', boundHandleMessageCreate);

    } catch (error) {
        console.error('Error saving webhook:', error);
    }
}






async function removeWebhook(client, identifier) {
    if (!identifier) {
        console.error("removeWebhook called without identifier");
        return null;
    }

    try {
        const webhook = await CharacterModel.findOneAndDelete({
            $or: [{ id: identifier }, { username: identifier }]
        });

        console.log("Looking for webhook with identifier:", identifier);

        if (!client.webhookListeners) {
            client.webhookListeners = new Map();
        }

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
