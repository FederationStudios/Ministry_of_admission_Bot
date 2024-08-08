const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');
const noblox = require('noblox.js'); // Ensure noblox.js is installed and required
const config = require('./../../config.json')

// Roblox cookie from config
const robloxCookie = config.robloxCookie;

// Login function for Roblox
async function loginRoblox() {
    await noblox.setCookie(robloxCookie); // Replace with your Roblox cookie
}

// Function to check if a user is in-game
async function isUserInGame(userId) {
    try {
        const presences = await fetch('https://presence.roblox.com/v1/presence/users', {
            method: 'POST',
            body: JSON.stringify({ userIds: [userId] }),
            headers: {
                'Content-Type': 'application/json',
                Cookie: `.ROBLOSECURITY=${robloxCookie}`
            }
        }).then(res => res.json());
        
        const presence = presences.userPresences ? presences.userPresences[0] : null;
        return presence && presence.userPresenceType === 2; // Check if the user is in-game
    } catch (error) {
        console.error('Error checking if user is in game: ', error);
        return false;
    }
}

module.exports = {
    name: 'requestreplacement',
    data: new SlashCommandBuilder()
        .setName('requestreplacement')
        .setDescription('Request a replacement when leaving the game')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Your Roblox username')
                .setRequired(true))
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
        const username = interaction.options.getString('username');
        const leaveTime = interaction.options.getString('time');

        try {
            // Login to Roblox API
            await loginRoblox();

            // Get user ID from username
            const userId = await noblox.getIdFromUsername(username);

            // Check if the user is in-game
            const isInGame = await isUserInGame(userId);
            if (!isInGame) {
                return interaction.reply({ content: 'User must be in-game to request a replacement.', ephemeral: true });
            }

            const replacementEmbed = new EmbedBuilder()
                .setTitle('Replacement Request')
                .setDescription(`${interaction.user.tag} is leaving the game at ${leaveTime} and needs a replacement.`)
                .addFields(
                    { name: 'Username', value: username },
                )
                .setFooter({ text: 'Click Claim if you can replace this user.' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('claim')
                        .setLabel('Claim')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('deny')
                        .setLabel('Deny')
                        .setStyle(ButtonStyle.Danger),
                );

            await interaction.reply({ embeds: [replacementEmbed], components: [row] });

        } catch (error) {
            console.error('Error handling requestreplacement command: ', error);
            await interaction.reply({ content: 'An error occurred while processing your request. Please try again later.', ephemeral: true });
        }
    }
};
