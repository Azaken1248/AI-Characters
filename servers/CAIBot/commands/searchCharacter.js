const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const CAINode = require('cainode');

function normalizeScores(min, max, score) {
  if (max === min) return 50;
  return Math.round(((score - min) / (max - min)) * 100);
}

function getMinAndMaxScores(characters) {
  const scores = characters.map(c => c.search_score || 0);
  return [Math.min(...scores), Math.max(...scores)];
}

function normalizeSearch(rawResults) {
  const normalizedSearch = {};
  const filteredArr = [];

  const charList = Array.from(rawResults["characters"]);
  const [minScore, maxScore] = getMinAndMaxScores(charList);

  charList.forEach(character => {
    const charName = character["participant__name"];
    const imgSrc = "https://characterai.io/i/80/static/avatars/" + character["avatar_file_name"];
    const character_id = character["external_id"];
    const search_score = character["search_score"];
    const popularity = normalizeScores(minScore, maxScore, search_score);

    filteredArr.push({
      name: charName,
      pfp: imgSrc,
      id: character_id,
      popularity,
    });
  });

  normalizedSearch["characters"] = filteredArr;
  return normalizedSearch;
}

async function searchCharacters(client, keyword) {
  try {
    const searchResults = await client.character.search(keyword);
    return normalizeSearch(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    return {};
  }
}

function buildEmbed(characters, page, keyword) {
  const embed = new EmbedBuilder()
    .setTitle(`Search results for "${keyword}" (Page ${page + 1})`)
    .setColor('Blue')
    .setThumbnail(characters[page].pfp)
    .addFields(
      {
        name: `${characters[page].name} (${characters[page].popularity}%)`,
        value: `[View on Character.AI](https://character.ai/chat/${characters[page].id})`,
      },
      {
        name: 'Character ID',
        value: characters[page].id,
        inline: true,
      }
    )
    .setFooter({ text: `Result ${page + 1} of ${characters.length}` });

  return embed;
}

function getButtons(currentPage, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('prev_page')
      .setLabel('⏮️ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0),
    new ButtonBuilder()
      .setCustomId('next_page')
      .setLabel('Next ⏭️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === totalPages - 1),
    new ButtonBuilder()
      .setCustomId('copy_id')
      .setLabel('📋 Copy ID')
      .setStyle(ButtonStyle.Primary)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('searchcharacter')
    .setDescription('Search for Character AI characters')
    .addStringOption(opt =>
      opt.setName('keyword')
         .setDescription('The name or keyword to search')
         .setRequired(true)),
  
  async execute(interaction) {
    const keyword = interaction.options.getString('keyword');

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
      const searchResults = await searchCharacters(node, keyword);

      const characters = searchResults.characters;
      if (!characters || characters.length === 0) {
        return interaction.editReply('No characters found for that keyword.');
      }

      let currentPage = 0;
      const totalPages = characters.length;

      const embed = buildEmbed(characters, currentPage, keyword);
      const components = [getButtons(currentPage, totalPages)];

      const message = await interaction.editReply({ embeds: [embed], components });

      const collector = message.createMessageComponentCollector({
        time: 2 * 60 * 1000 // 2 minutes
      });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: "You can't control this interaction.", ephemeral: true });
        }

        if (i.customId === 'prev_page' && currentPage > 0) {
          currentPage--;
        } else if (i.customId === 'next_page' && currentPage < totalPages - 1) {
          currentPage++;
        } else if (i.customId === 'copy_id') {
          return i.reply({
            content: `🆔 Character ID: \`${characters[currentPage].id}\``,
            ephemeral: true,
          });
        }

        const newEmbed = buildEmbed(characters, currentPage, keyword);
        await i.update({ embeds: [newEmbed], components: [getButtons(currentPage, totalPages)] });
      });

      collector.on('end', () => {
        message.edit({ components: [] }).catch(() => {});
      });

    } catch (err) {
      console.error('Error in /searchcharacter:', err);
      await interaction.editReply({ content: 'An error occurred while searching. Try again later.' });
    }
  }
};
