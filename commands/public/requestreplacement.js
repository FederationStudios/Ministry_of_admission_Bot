// eslint-disable no-undef
// eslint-disable-next-line no-unused-vars
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');
const noblox = require('noblox.js'); // Ensure noblox.js is installed and required
const { getRowifi } = require('../../functions');
const config = require('../../config.json')


module.exports = {
    name: 'requestreplacement',
    description: 'Request a replacement when leaving the game',
    data: new SlashCommandBuilder()
        .setName('requestreplacement')
        .setDescription('Request a replacement when leaving the game')
        .addStringOption(option => 
            option.setName('time')
                .setDescription('The time you are leaving the game')
                .setRequired(true)),
    /**
    * @param {Client} client
    * @param {CommandInteraction} interaction
    * @param {CommandInteractionOptionResolver} options
    */                      
    run: async (client, interaction, options) => {
        await interaction.deferReply({ ephemeral: false });
        const leaveTime = interaction.options.getString('time');

        try {
            
            // Get user ID from username
            const id = interaction.user.id;
 
            const rowifi = await getRowifi(id, client);

            if (!rowifi.success) {
              return interaction.editReply({content: 'You need to be verified with Rowifi to continue.', ephemeral: true});
          }
         
          if(leaveTime < 5) return interaction.editReply(`<@!${interaction.user.id}> Must be greater than 5 minutes!`);
         
          const username = await noblox.getUsernameFromId(rowifi.roblox);
         
          console.log(rowifi.roblox);
            // Check if the user is in-game
    
            await interaction.editReply(`<@&842719074780708914> is requesting for replacement! GET READY YAYAYA!!!!`)
            const replacementEmbed = new EmbedBuilder()
                .setTitle('Replacement Request')
                .setDescription(`**<@!${interaction.user.id}> is leaving the game at ${leaveTime} minutes and needs a replacement.**`)
                .addFields(
                    { name: 'Username', value: username },
                    { name: 'Profile Link', value: `https://www.roblox.com/users/${rowifi.roblox}/profile` }
                )
                .setFooter({ text: 'Click Claim if you can replace this user.' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('claim')
                        .setLabel('Claim')
                        .setEmoji("✅")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('deny')
                        .setLabel('Deny')
                        .setEmoji("💣")
                        .setStyle(ButtonStyle.Danger),
                );

            await interaction.editReply({ embeds: [replacementEmbed], components: [row] });

        } catch (error) {
            console.error('Error handling requestreplacement command: ', error);
            await interaction.editReply({ content: 'An error occurred while processing your request. Please try again later.', ephemeral: true });
        }
    }
};