const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createcharacter')
    .setDescription('Create a new AI character and return its ID')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Character title')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Character name')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('identifier')
        .setDescription('Character identifier')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Character description')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('greeting')
        .setDescription('Greeting message')
        .setRequired(true)),

  async execute(interaction) {
    const title = interaction.options.getString('title');
    const name = interaction.options.getString('name');
    const identifier = interaction.options.getString('identifier');
    const description = interaction.options.getString('description');
    const greeting = interaction.options.getString('greeting');

    if (!process.env.CAI_AUTH_TOKEN) {
      return await interaction.reply({
        content: "Please set your Character AI token using `!setCAIAuth <token>`.",
        ephemeral: true
      });
    }

    const url = "https://plus.character.ai/chat/character/create/";
    const headers = {
      "Authorization": `Token ${process.env.CAI_AUTH_TOKEN}`,
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
    };

    const data = {
      title,
      name,
      identifier,
      categories: [],
      visibility: "PUBLIC",
      copyable: false,
      description,
      greeting,
      definition: "",
      avatar_rel_path: "",
      img_gen_enabled: false,
      base_img_prompt: "",
      strip_img_prompt_from_msg: false,
      voice_id: "",
      default_voice_id: ""
    };

    try {
      const response = await axios.post(url, data, { headers });
      const characterData = response.data.character;

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle(`Character Created: ${characterData.name}`)
        .setDescription(characterData.description)
        .addFields(
          { name: "Character ID", value: characterData.id.toString(), inline: true },
          { name: "External ID", value: characterData.external_id, inline: true },
          { name: "Title", value: characterData.title, inline: true },
          { name: "Greeting", value: characterData.greeting, inline: false },
        )
        .setFooter({ text: "Character created successfully!" });

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error("Failed to create character:", error.response?.data || error.message);
      await interaction.reply({
        content: "Failed to create character. Please try again later.",
        ephemeral: true
      });
    }
  }
};
