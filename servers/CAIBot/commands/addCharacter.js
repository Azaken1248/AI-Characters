const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const CAINode = require('cainode');
const { saveWebhook } = require('../utils/webhookUtils.js');
const { handleMessageCreate } = require('../utils/concurrencyUtils.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addcharacter')
    .setDescription('Add an AI Character to this server')
    .addStringOption(opt =>
      opt.setName('id')
         .setDescription('The Character AI ID')
         .setRequired(true))
    .addBooleanOption(opt =>
      opt.setName('ignore_bots')
         .setDescription('Ignore messages from other bots')
         .setRequired(true))
    .addBooleanOption(opt =>
      opt.setName('only_self_webhook')
         .setDescription('Only respond to messages sent by this bot\'s webhook')
         .setRequired(true)),
         
  async execute(interaction) {
    const client = interaction.client;
    const charID = interaction.options.getString('id');
    const ignoreBots = interaction.options.getBoolean('ignore_bots') ?? false;
    const onlySelfWebhook = interaction.options.getBoolean('only_self_webhook') ?? false;

    if (!process.env.CAI_AUTH_TOKEN) {
      return interaction.reply({
        content: 'Please use `/setcai-auth <token>` to set your token first.',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const node = new CAINode();
    try {
      await node.login(process.env.CAI_AUTH_TOKEN);
      const characterDetails = await node.character.info(charID);

      const uname = characterDetails.character?.name ?? 'Unknown Name';
      const avatarFileName = characterDetails.character?.avatar_file_name;
      const pfp = avatarFileName
        ? `https://characterai.io/i/80/static/avatars/${avatarFileName}`
        : null;
      const caiLink = `https://character.ai/chat/${characterDetails.character.external_id}`;

      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle(uname)
        .setDescription(characterDetails.character.description || '')
        .setThumbnail(pfp)
        .addFields({ name: 'CAI Link', value: `[${uname}](${caiLink})`, inline: true });

        const character = await node.character.connect(charID);

      const channel = interaction.channel;
      const serverID = interaction.guildId;
      const channelID = interaction.channelId;
      const listenerID = `${serverID}-${channelID}-${charID}`;

      let webhook;
      let status = {
        text: 'Failed to create webhook!',
        iconURL: 'https://i.ibb.co/vznjJH0/cross.png'
      };

      try {
        webhook = await channel.createWebhook({ name: uname, avatar: pfp });
        await saveWebhook(client,
          webhook.name,
          { id: webhook.id, token: webhook.token },
          charID,
          { ignoreBots, onlySelfWebhook }, 
          serverID,
          channelID,
          listenerID
        );
        status = {
          text: 'Saved webhook successfully!',
          iconURL: 'https://i.ibb.co/NVrHCky/tick.png'
        };
      } catch (err) {
        console.error('Failed to create webhook:', err);
      }

      embed.setFooter({ text: status.text, iconURL: status.iconURL });

      await interaction.editReply({ embeds: [embed] });

      if (!client.webhookListeners) client.webhookListeners = new Map();
      if (client.webhookListeners.has(listenerID)) {
        client.removeListener('messageCreate', client.webhookListeners.get(listenerID));
      }

      const boundHandler = msg => handleMessageCreate(msg, {
        id: webhook.id,
        token: webhook.token,
        characterID: charID,
        clientCAI: node,
        options: {
          ignoreBots,
          onlySelfWebhook
        }
      });

      client.webhookListeners.set(listenerID, boundHandler);
      client.on('messageCreate', boundHandler);

    } catch (error) {
      console.error('Error in /addcharacter command:', error);
      if (interaction.deferred) {
        await interaction.editReply({ content: 'Invalid character ID.' });
      } else {
        await interaction.reply({ content: 'Invalid character ID.', ephemeral: true });
      }
    }
  },
};
