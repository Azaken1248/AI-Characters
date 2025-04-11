const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setcai-auth')
    .setDescription('Set the Character AI auth token')
    .addStringOption(option =>
      option
        .setName('token')
        .setDescription('Your CAI auth token')
        .setRequired(true)
    ),

  async execute(interaction) {
    const authToken = interaction.options.getString('token');
    await interaction.deferReply({ ephemeral: true });

    const envPath = path.resolve(__dirname, '../.env');
    try {
      let data = '';
      try {
        data = await fs.promises.readFile(envPath, 'utf8');
      } catch (readErr) {
        if (readErr.code !== 'ENOENT') throw readErr;
      }

      const lines = data.split('\n');
      let tokenSet = false;

      const newLines = lines.map(line => {
        if (line.startsWith('CAI_AUTH_TOKEN=')) {
          tokenSet = true;
          return `CAI_AUTH_TOKEN=${authToken}`;
        }
        return line;
      });

      if (!tokenSet) {
        newLines.push(`CAI_AUTH_TOKEN=${authToken}`);
      }

      await fs.promises.writeFile(envPath, newLines.join('\n'), 'utf8');
      console.log('Auth token set successfully.');
      await interaction.editReply({ content: '✅ Auth token set successfully.', ephemeral: true });
    } catch (error) {
      console.error('Error setting auth token:', error);
      await interaction.editReply({ content: '❌ Error writing to the .env file.', ephemeral: true });
    }
  },
};
