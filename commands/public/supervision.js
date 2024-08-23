const { Client, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require("discord.js");
const { getRowifi } = require("../../functions.js");
const noblox = require("noblox.js");

const claimedRequests = new Map();

module.exports = {
    name: "supervision",
    description: "Request supervision and provide your details.",
    data: new SlashCommandBuilder()
        .setName('supervision')
        .setDescription('Request supervision and provide your details.')
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Type in whole number and in hours, others are not allowed.')
                .setRequired(true)),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */            
    run: async (client, interaction) => {
        try {
            // Defer the reply to give more time for processing
            await interaction.deferReply({ ephemeral: false });

            const duration = interaction.options.getString("duration");
            const id = interaction.user.id;

            const rowifi = await getRowifi(id, client);

            if (!rowifi.success) {
                return interaction.editReply({ content: 'You need to be verified with RoWifi to continue.' });
            }

            const robloxUsername = rowifi.username;
            const admissionRank = await noblox.getRankNameInGroup(3052496, rowifi.roblox);

            const embed = new EmbedBuilder()
                .setTitle("Supervision Request")
                .addFields(
                    { name: "Username", value: robloxUsername, inline: true },
                    { name: "Rank", value: admissionRank, inline: false },
                    { name: "Duration of Availability", value: `${duration} hours`, inline: false },
                    { name: "Profile Link", value: `https://www.roblox.com/users/${rowifi.roblox}/profile`, inline: false }
                )
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp()
                .setColor("Aqua");

            const claimButton = new ButtonBuilder()
                .setCustomId('claim')
                .setLabel('Claim')
                .setEmoji("✅")
                .setStyle(ButtonStyle.Success);

            const denyButton = new ButtonBuilder()
                .setCustomId('deny')
                .setLabel('Deny')
                .setEmoji("💣")
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(claimButton, denyButton);
            const content = `<@&842716052881801217> and <@&842717207528079410> | Submitted at <t:${Math.floor(Date.now()/1000)}:T>`;
            const message = await interaction.editReply({
                content: content,
                embeds: [embed],
                components: [row],
                fetchReply: true
            });

            const requestId = message.id;

            const filter = i => i.customId === 'claim' || i.customId === 'deny';

            // Convert duration from hours to milliseconds
            const durationInHours = parseInt(duration, 10);  // Ensure it is an integer
            const durationInMilliseconds = durationInHours * 60 * 60 * 1000;  // Convert to milliseconds

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: durationInMilliseconds });

            collector.on('collect', async i => {
                const claimant = i.user;

                if (i.customId === 'claim') {
                    if (claimant.id === id) {
                        return i.reply({ content: '**You cannot claim your own request.**', ephemeral: true });
                    }

                    if (claimedRequests.has(requestId)) {
                        return i.reply({ content: 'This request has already been claimed.', ephemeral: true });
                    }

                    const rowifiClaimant = await getRowifi(claimant.id, client);

                    if (!rowifiClaimant.success) {
                        return i.reply({ content: 'You must be verified with RoWifi to claim this request.', ephemeral: true });
                    }

                    claimedRequests.set(requestId, claimant.id);

                    await i.update({ content: `Supervision claimed by <@&${claimant.id}>. Please check your DMs.`, components: [] });

                } else if (i.customId === 'deny') {
                    if (claimant.id !== id) {
                        return i.reply({ content: 'You cannot deny this request. Only the original requester can deny it.', ephemeral: true });
                    }

                    if (!i.replied && !i.deferred) {
                        await i.update({ content: 'Supervision request denied.', components: [] });
                    }

                    claimedRequests.delete(requestId);
                }
            });

            collector.on('end', async collected => {
                if (collected.size === 0 && !claimedRequests.has(requestId)) {
                    await interaction.editReply({ content: 'No one claimed the supervision request in time.', components: [] });
                }
            });

        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
            }
        }
    }
};
