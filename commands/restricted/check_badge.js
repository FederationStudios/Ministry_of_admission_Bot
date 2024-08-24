// eslint-disable no-undef
// eslint-disable no-unused-vars
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Client, CommandInteraction } = require('discord.js'); // eslint-disable-line no-unused-vars
const noblox = require('noblox.js');
const { requiredRoles } = require("../../config.json");
const { interactionEmbed } = require('../../functions');
module.exports = {
    name: 'check_badge',
    description: 'Check if a player has a specific badge',
    data: new SlashCommandBuilder()
        .setName('check_badge')
        .setDescription('Check if a player has a specific badge')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Roblox username')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('badge_id')
                .setDescription('ID of the badge to check')
                .setRequired(true)),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */           
    run: async(client, interaction) => {
        await interaction.deferReply({ephemeral: false});

        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
         return interactionEmbed(3, "[ERR-UPRM]",'', interaction, client, [true, 30]);
         }

        const username = interaction.options.getString('username');
        const badgeId = interaction.options.getString('badge_id');

        try {
            // Get the userId from the username
            const userId = await noblox.getIdFromUsername(username);

            // Fetch the player's badges
            const badges = await noblox.getPlayerBadges(userId);

            // Find the specific badge
            const badge = badges.find(badge => badge.id === parseInt(badgeId));

            // Prepare the embed
            const embed = new EmbedBuilder()
                .setTitle('Badge Check')
                .setDescription(`Checking if **${username}** has the badge with ID **${badgeId}**...`)
                .setColor(badge ? 'Green' : 'Red');

            if (badge) {
                embed.addFields(
                    { name: 'Result', value: `✅ **${username}** has this badge.` },
                    { name: 'Badge Name', value: badge.name, inline: true },
                    { name: 'Badge Description', value: badge.description || 'No description available.', inline: true }
                );
            } else {
                embed.addFields({ name: 'Result', value: `❌ **${username}** does not have this badge.` });
            }

            // Send the result
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error checking badge: ', error);
            await interaction.editReply({ content: 'There was an error checking the badge. Please try again later.', ephemeral: true });
        }
    },
};
