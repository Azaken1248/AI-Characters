const { WebhookClient } = require('discord.js');
const { filterMessage } = require('./stringUtils.js');

const messageQueues = new Map();
const processingFlags = new Map();
const RATE_LIMIT_MS = 2000;

async function handleMessageCreate(msg, webhook) {
    if (messageQueues.get(webhook.characterID)?.some(e => e.msg.id === msg.id)) {
      console.log(`⚠️ Duplicate message blocked: ${msg.id}`);
      return;
    }
  
    console.log(`[${webhook.characterID}] 📥 Received Discord message: ${msg.content}`);
  
    if (msg.webhookId === webhook.id) {
      return;
    }
  
    if (msg.content.startsWith('!')) {
      return;
    }
  
    if (webhook.options.ignoreBots && msg.author.bot && !msg.webhookId) {
      console.log(`[${webhook.characterID}] 🚫 Ignoring bot message: ${msg.author.tag}`);
      return;
    }
  
    if (webhook.options.onlySelfWebhook) {
      if (msg.webhookId !== webhook.id && msg.webhookId) {
          console.log(
              `[${webhook.characterID}] 🚫 onlySelfWebhook is on; ignoring webhook ${msg.webhookId}`
          );
          return;
      }
  }
  
    if (!messageQueues.has(webhook.characterID)) {
      messageQueues.set(webhook.characterID, []);
      processingFlags.set(webhook.characterID, false);
    }
  
    const queue = messageQueues.get(webhook.characterID);
    const token = queue.length + 1;
    queue.push({ msg, token });
  
    console.log(`[${webhook.characterID}] 📨 Queued msg #${token}: ${msg.content}`);
  
    if (!processingFlags.get(webhook.characterID)) {
      processingFlags.set(webhook.characterID, true);
      processQueue(webhook);
    }
  }
  


async function processQueue(webhook) {
    const queue = messageQueues.get(webhook.characterID);

    if (!queue || queue.length === 0) {
        processingFlags.set(webhook.characterID, false);
        return;
    }

    const { msg, token } = queue[0];
    console.log(`[${webhook.characterID}] 🕐 Processing msg #${token}: ${msg.content}`);

    try {
        if (!webhook.clientCAI?.character?.send_message || !webhook.clientCAI?.character?.generate_turn) {
            console.error(`❌ [${webhook.characterID}] Missing CAI character methods`);
            throw new Error("Invalid CAI character instance");
        }

        console.log(`[${webhook.characterID}] ✉️ Sending to CAI: ${msg.author.username}: ${msg.content.trim()}`);
        await webhook.clientCAI.character.send_message(`${msg.author.username}: ${msg.content.trim()}`, true, "");

        console.log(`[${webhook.characterID}] 🔄 Generating reply...`);
        const response = await webhook.clientCAI.character.generate_turn();

        if (response?.turn?.candidates?.length > 0) {
            const responseText = response.turn.candidates[0].raw_content;
            console.log(`[${webhook.characterID}] 🧠 Got reply: ${responseText}`);

            const webhookClient = new WebhookClient({ id: webhook.id, token: webhook.token });
            if (!webhookClient) return;

            await webhookClient.send(filterMessage(responseText));
            console.log(`[${webhook.characterID}] ✅ Response sent`);
        } else {
            console.warn(`[${webhook.characterID}] ⚠️ No response candidates from character`);
        }
    } catch (error) {
        console.error(`[${webhook.characterID}] 🔥 Error while processing message #${token}:`, error);
    } finally {
        queue.shift();
        setTimeout(() => processQueue(webhook), RATE_LIMIT_MS);
    }
}

module.exports = { handleMessageCreate, processQueue };
