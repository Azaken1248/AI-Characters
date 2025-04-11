const { SlashCommandBuilder } = require('@discordjs/builders');
const { removeWebhook, loadWebhooks } = require('../utils/webhookUtils.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removecharacter')
    .setDescription('Remove a CAI Character by webhook name or ID')
    .addStringOption(opt =>
      opt
        .setName('name')
        .setDescription('The name of the webhook to remove')
        .setRequired(false))
    .addStringOption(opt =>
      opt
        .setName('id')
        .setDescription('The ID of the webhook to remove')
        .setRequired(false)),
        async execute(interaction) {
            const webhookName = interaction.options.getString('name');
            const webhookId   = interaction.options.getString('id');
          
            if ((!webhookName && !webhookId) || (webhookName && webhookId)) {
              return interaction.reply({
                content: 'Please provide **either** a webhook `name` **or** `id`, but not both.',
                ephemeral: true
              });
            }
          
            await interaction.deferReply();
          
            try {
              if (webhookName) {
                const webhooks = await loadWebhooks(interaction.client);

                const webhookMap = {};
                for (const wh of webhooks) {
                    webhookMap[wh.username] = wh;   
                }


                if (!webhookMap[webhookName]) {
                  return interaction.editReply(`❌ Webhook named \`${webhookName}\` not found.`);
                }
          
                const remID = webhookMap[webhookName].id;
                await interaction.client.deleteWebhook(remID);
                await removeWebhook(interaction.client, webhookName);
          
                const handler = interaction.client.webhookListeners?.get(remID);
                if (handler) {
                  interaction.client.removeListener('messageCreate', handler);
                  interaction.client.webhookListeners.delete(remID);
                }
          
                return interaction.editReply(`✅ Webhook \`${webhookName}\` removed successfully.`);
              }
          
              const deleted = await removeWebhook(interaction.client, webhookId);
              if (!deleted) {
                return interaction.editReply(`❌ Webhook with ID \`${webhookId}\` not found.`);
              }
          
              await interaction.client.deleteWebhook(webhookId);
              const handler = interaction.client.webhookListeners?.get(webhookId);
              if (handler) {
                interaction.client.removeListener('messageCreate', handler);
                interaction.client.webhookListeners.delete(webhookId);
              }
          
              return interaction.editReply(`✅ Webhook with ID \`${webhookId}\` removed successfully.`);
            } catch (error) {
              console.error('Error in /removecharacter:', error);
              return interaction.editReply('⚠️ Failed to delete webhook.');
            }
          }
          
};
