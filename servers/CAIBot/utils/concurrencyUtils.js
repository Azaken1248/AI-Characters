const { WebhookClient } = require('discord.js');
const { filterMessage } = require('./stringUtils.js');

const messageQueues = new Map();  
const processingFlags = new Map();  
const RATE_LIMIT_MS = 2000;

async function handleMessageCreate(msg, flag, webhook) {
    let check = false;

    // Character-specific logic for ignoring messages based on flag
    if (flag === '-c') {
        check = msg.author.bot;  
    } else if (flag === '-f') {
        check = msg.webhookId && msg.webhookId === webhook.id; 
    }

    // Ignore if check is true or message starts with "!"
    if (check || msg.content.startsWith("!")) {
        return;
    }

    // Ensure there is a queue for this characterID
    if (!messageQueues.has(webhook.characterID)) {
        messageQueues.set(webhook.characterID, []);
        processingFlags.set(webhook.characterID, false);  
    }

    // Add message to the queue for this characterID
    const queue = messageQueues.get(webhook.characterID);
    const token = queue.length + 1;  
    queue.push({ msg, token });

    // Process the queue if not already processing
    if (!processingFlags.get(webhook.characterID)) {
        processQueue(webhook);
    }
}

async function processQueue(webhook) {
    const queue = messageQueues.get(webhook.characterID);

    // Check if the queue for this character is empty
    if (!queue || queue.length === 0) {
        processingFlags.set(webhook.characterID, false);
        return;
    }

    processingFlags.set(webhook.characterID, true);

    // Sort the queue by token to ensure correct message order
    queue.sort((a, b) => a.token - b.token);

    // Process the first message in the queue
    const { msg, token } = queue[0];

    try {
        // Send message to the character via webhook.clientCAI
        await webhook.clientCAI.character.send_message(`${msg.author.username}: ${msg.content.trim()}`, true, "");

        // Generate response from the character
        let response = await webhook.clientCAI.character.generate_turn();
        if (response && response.turn && response.turn.candidates && response.turn.candidates.length > 0) {
            const responseText = response.turn.candidates[0].raw_content;
            console.log(`Response: `, responseText);

            // Send response via webhook
            const webhookClient = new WebhookClient({ id: webhook.id, token: webhook.token });
            await webhookClient.send(filterMessage(responseText));
            console.log("Response sent:", responseText);
        } else {
            console.log("No response from character");
        }
    } catch (error) {
        console.log("Message Error: ", error);
    }

    // Remove the processed message from the queue
    queue.shift();

    // Continue processing the queue with a rate limit delay
    setTimeout(() => processQueue(webhook), RATE_LIMIT_MS);
}

module.exports = { handleMessageCreate, processQueue };
