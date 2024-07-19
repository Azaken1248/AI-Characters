const fs = require('fs');

function saveWebhook(webhookName, webhookData, characterID, flag) {
    const PATH = './storage/webhooks.json';
    let webhooks = {};
    
    if (fs.existsSync(PATH)) {
        webhooks = JSON.parse(fs.readFileSync(PATH, 'utf8') || '{}');
    }
    
    webhooks[webhookName] = { ...webhooks[webhookName], ...webhookData, characterID, flag };
    console.log(webhooks);
    fs.writeFileSync(PATH, JSON.stringify(webhooks, null, 2));
}

async function loadWebhooks(clientCAI) {
    const PATH = './storage/webhooks.json';
    if (!fs.existsSync(PATH)) {
        return {};
    }
    const webhooks = JSON.parse(fs.readFileSync(PATH, 'utf8') || '{}');
    
    for (const webhookName in webhooks) {
        const { characterID } = webhooks[webhookName];
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

async function removeWebhook(identifier) {
    const PATH = './storage/webhooks.json';

    if (!fs.existsSync(PATH)) {
        console.error("Webhooks file does not exist.");
        return null;
    }

    let webhooks = JSON.parse(fs.readFileSync(PATH, 'utf8') || '{}');

    let webhookIdToRemove = null;
    let webhookNameToRemove = null;

    for (const [name, data] of Object.entries(webhooks)) {
        if (data.id === identifier) {
            webhookIdToRemove = data.id;
            webhookNameToRemove = name;
            break;
        }
        if (name === identifier) {
            webhookNameToRemove = name;
            webhookIdToRemove = data.id;
            break;
        }
    }

    if (webhookNameToRemove) {
        delete webhooks[webhookNameToRemove];
        fs.writeFileSync(PATH, JSON.stringify(webhooks, null, 2));
        console.log(`Webhook with ${webhookIdToRemove ? 'ID' : 'name'} '${identifier}' removed.`);
        return webhookIdToRemove;
    } else {
        console.error(`Webhook with identifier '${identifier}' does not exist.`);
        return null;
    }
}


module.exports = {
    saveWebhook,
    loadWebhooks,
    removeWebhook
};