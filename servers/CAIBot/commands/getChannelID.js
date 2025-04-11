const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getchannelid')
    .setDescription('Get the current channel ID'),

  async execute(interaction) {
    const channelId = interaction.channelId;
    console.log(channelId);
    await interaction.reply(`Channel ID: \`${channelId}\``);
  },
};
