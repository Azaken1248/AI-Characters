const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getlogs')
    .setDescription('Get debug logs of the bot'),
    
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const logFilePath = path.resolve(__dirname, '../storage/logs.txt');
      console.log('Resolved log file path:', logFilePath);

      if (!fs.existsSync(logFilePath)) {
        console.log('Log file does not exist.');
        return interaction.editReply({ content: 'Log file not found.' });
      }

      console.log('Log file exists. Sending the file...');
      const logs = fs.readFileSync(logFilePath, 'utf8');

      const attachment = new AttachmentBuilder(logFilePath);
      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('Debug Logs')
        .setDescription(`\`\`\`${logs.slice(-2048)}\`\`\``);

      await interaction.editReply({
        content: 'Here are the debug logs:',
        embeds: [embed],
        files: [attachment],
      });
    } catch (error) {
      console.error('Error sending log file:', error);

      if (interaction.deferred) {
        await interaction.editReply({ content: 'There was an error sending the log file.' });
      } else {
        await interaction.reply({ content: 'There was an error sending the log file.', ephemeral: true });
      }
    }
  },
};
