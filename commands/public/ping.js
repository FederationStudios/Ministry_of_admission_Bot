// eslint-disable no-undef
// eslint-disable-next-line no-unused-vars
const { SlashCommandBuilder, Client, CommandInteraction } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Shows the bot\'s ping.',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Bot\'s ping.'),
    /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
    run: async (client, interaction) => {
        await interaction.deferReply();
        const pings = [];
        const now = Date.now();
        await interaction.editReply({ content: 'Testing ping... [0/2]' });
        await interaction.editReply({ content: 'Testing ping... [1/2]' });
        pings.push(Date.now()-now);
        pings.push(client.ws.shards.first().ping);
        interaction.editReply({ content: `**Latency Test Complete**\n> WebSocket Latency: ${pings[0]}\n> API Latency: ${pings[1]}\n\nCoded and Maintanied by suman9725`});
    }
};