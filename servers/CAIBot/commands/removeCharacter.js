const { removeWebhook, loadWebhooks } = require('../utils/webhookUtils.js');

module.exports = {
    name: "removeCharacter",
    description: "Remove A CAI Character",
    async execute(clientCAI, client, message, args) {
        if (args.length === 0) {
            message.reply("Enter a Webhook Name or ID!");
            return;
        }

        try {
            if (args[0] === "-n") {
                const webhooks = await loadWebhooks(clientCAI);
                const webhookName = args[1];
                if (!webhooks[webhookName]) {
                    message.reply(`Webhook with name '${webhookName}' not found.`);
                    return;
                }
                const remID = webhooks[webhookName].id;
                await client.deleteWebhook(remID);
                removeWebhook(webhookName);

                const handleMessageCreate = client.webhookListeners.get(remID);
                if (handleMessageCreate) {
                    client.removeListener('messageCreate', handleMessageCreate);
                    client.webhookListeners.delete(remID);
                }

                message.reply(`Webhook '${webhookName}' removed successfully.`);
            } else if (args[0] === "-i") {
                const webhookId = args[1];
                const deletedWebhookId = await removeWebhook(webhookId);
                if (deletedWebhookId) {
                    await client.deleteWebhook(webhookId);
                    
                    const handleMessageCreate = client.webhookListeners.get(webhookId);
                    if (handleMessageCreate) {
                        client.removeListener('messageCreate', handleMessageCreate);
                        client.webhookListeners.delete(webhookId);
                    }

                    message.reply(`Webhook with ID '${webhookId}' removed successfully.`);
                } else {
                    message.reply(`Webhook with ID '${webhookId}' not found.`);
                }
            } else {
                message.reply("Invalid option. Use -n for name or -i for ID.");
            }
        } catch (error) {
            console.error(error);
            message.reply("Failed to delete webhook!");
        }
    },
};
