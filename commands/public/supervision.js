const { EmbedBuilder, SlashCommandBuilder, CommandInteraction, Client, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getRowifi } = require('../../functions');
const noblox = require('noblox.js');

module.exports = {
    name: 'request_oa_event',
    description: 'Request an event with specific details.',
    data: new SlashCommandBuilder()
        .setName('request_oa_event')
        .setDescription('Request an event with specific details.')
        .addIntegerOption(option =>
            option.setName('time')
                .setDescription('Time available for the event in hours')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('event_type')
                .setDescription('Select the type of event')
                .addChoices(
                    { name: 'OCG I', value: 'OCG I' },
                    { name: 'OCG II', value: 'OCG II' },
                    { name: 'OCG III', value: 'OCG III' },
                    { name: 'Staff Events', value: 'Staff Events' },
                )
                .setRequired(true))
        .addStringOption(option =>
            option.setName('event')
                .setDescription('Select event')
                .addChoices(
                    { name: 'Co-host', value: 'Co-host' },
                    { name: 'Weapons Training', value: 'Weapons Training' },
                    { name: 'Discipline Training', value: 'Discipline Training' },
                    { name: 'Patrol Supervision', value: 'Patrol Supervision' },
                    { name: 'Physical Training', value: 'Physical Training' },
                    { name: 'Situational Discipline Training', value: 'Situational Discipline Training' },
                    { name: 'Situational Moderation Training', value: 'Situational Moderation Training' },
                    { name: 'UT Evaluation', value: 'UT Evaluation' },
                    { name: 'Essentials Lecture Pt.1', value: 'Essentials Lecture Pt.1' },
                    { name: 'Essentials Lecture Pt.2', value: 'Essentials Lecture Pt.2' },
                    { name: 'Knowledge Exam', value: 'Knowledge Exam' },
                )
                .setRequired(true)),

    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const time = interaction.options.getInteger('time');
        const eventDetails = interaction.options.getString('event');
        const id = interaction.user.id;
        const rowifi = await getRowifi(id, client);

        if (!rowifi.success) {
            return interaction.editReply({ content: 'You need to be verified with RoWifi to continue.' });
        }

        const username = rowifi.username;
        let currentRankOA;
        try {
            currentRankOA = await noblox.getRankNameInGroup(10436572, rowifi.roblox); // OA group
        } catch (error) {
            return interaction.editReply({ content: 'Failed to fetch current rank. Please try again later.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('Event Request')
            .setDescription(
                `**Username:** <@!${interaction.user.id}> (${username})\n` +
                `**Rank:** ${currentRankOA || 'N/A'}\n` +
                `**Event Requested:** ${eventDetails}\n` +
                `**Time Available:** ${time}h`
            )
            .setFooter({ text: `Requested by ${interaction.member.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        const acceptButton = new ButtonBuilder()
            .setCustomId('accept')
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success);

        const denyButton = new ButtonBuilder()
            .setCustomId('deny')
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(acceptButton, denyButton);

        const targetChannelId = '1265982268162183178'; // Replace with your channel ID
        const targetChannel = await interaction.client.channels.fetch(targetChannelId);

        const message = await targetChannel.send({ content: '<@&842716052881801217> and <@&842717207528079410>, a new event is up for grabs! Let\'s get to it.', embeds: [embed], components: [row] });
        
        const filter = i => ['accept', 'deny'].includes(i.customId);

        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'accept') {
                const allowedRoles = ['842716052881801217', '842717207528079410']; // Replace with the actual role IDs
                const hasPermission = i.member.roles.cache.some(role => allowedRoles.includes(role.id));
                if (!hasPermission) {
                    return i.reply({ content: 'You do not have permission to accept this event.', ephemeral: true });
                }
                await i.update({ content: `Event has been accepted by ${i.user.username}.`, components: [] });
            } else if (i.customId === 'deny') {
                if (i.user.id !== id) {
                    return i.reply({ content: 'You do not have permission to deny this event.', ephemeral: true });
                }
                await i.update({ content: 'The event request has been denied.', components: [] });
            }
        });

        collector.on('end', async () => {
            await message.edit({ components: [] }); // Remove buttons after the collector ends
        });

        await interaction.editReply({ content: 'Your event request has been submitted.', ephemeral: true });
    }
};
