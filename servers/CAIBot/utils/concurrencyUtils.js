const { WebhookClient } = require('discord.js');
const messageQueue = [];
let currentToken = 0;
let processing = false;
const RATE_LIMIT_MS = 2000;
const { filterMessage } = require('./stringUtils.js');

async function handleMessageCreate(msg, flag, node, webhook) {
    let check = false;

    if (flag === '-c') {
        check = msg.author.bot;
    } else if (flag === '-f') {
        check = msg.webhookId && msg.webhookId === webhook.id;
    }

    if (check || msg.content.startsWith("!")) {
        return;
    }

    const token = ++currentToken;
    messageQueue.push({ msg, token });

    if (!processing) {
        processQueue(node, webhook);
    }
}

async function processQueue(node, webhook) {
    if (messageQueue.length === 0) {
        processing = false;
        return;
    }

    processing = true;

    messageQueue.sort((a, b) => a.token - b.token);

    const { msg, token } = messageQueue[0];

    try {
        await node.character.send_message(`${msg.author.username}: ${msg.content.trim()}`, true, "");
        let response = await node.character.generate_turn();
        if (response && response.turn && response.turn.candidates && response.turn.candidates.length > 0) {
            const responseText = response.turn.candidates[0].raw_content;
            console.log(`Response: `, responseText);

            const webhookClient = new WebhookClient({ id: webhook.id, token: webhook.token });
            await webhookClient.send(filterMessage(responseText));
            console.log("Response sent:", responseText);
        } else {
            console.log("No response from character");
        }
    } catch (error) {
        console.log("Message Error: ", error);
    }

    messageQueue.shift();

    console.log(messageQueue);
    setTimeout(() => processQueue(node, webhook), RATE_LIMIT_MS);
}

module.exports = { handleMessageCreate, processQueue };
