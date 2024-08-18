// const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');
// const noblox = require('noblox.js');
// const config = require('./../../config.json');
// const { getRowifi, interactionEmbed } = require('../../functions');

// const robloxCookie = config.robloxCookie;

// async function loginRoblox() {
//     await noblox.setCookie(robloxCookie);
// }

// async function isUserInGame(userId) {
//     try {
//         const presences = await fetch('https://presence.roblox.com/v1/presence/users', {
//             method: 'POST',
//             body: JSON.stringify({ userIds: [userId] }),
//             headers: {
//                 'Content-Type': 'application/json',
//                 Cookie: `.ROBLOSECURITY=${robloxCookie}`
//             }
//         }).then(res => res.json());

//         const presence = presences.userPresences ? presences.userPresences[0] : null;
//         return presence && presence.userPresenceType === 2;
//     } catch (error) {
//         console.error('Error checking if user is in game: ', error);
//         return false;
//     }
// }

// module.exports = {
//     name: 'requestreplacement',
//     description: 'Request a replacement when leaving the game',
//     data: new SlashCommandBuilder()
//         .setName('requestreplacement')
//         .setDescription('Request a replacement when leaving the game')
//         .addStringOption(option => 
//             option.setName('time')
//                 .setDescription('The time you are leaving the game')
//                 .setRequired(true)),
//     /**
//     * @param {Client} client
//     * @param {CommandInteraction} interaction
//     * @param {CommandInteractionOptionResolver} options
//     */                      
//     run: async (client, interaction, options) => {
//         await interaction.deferReply({ ephemeral: false });
//         const leaveTime = interaction.options.getString('time');

//         try {
//             await loginRoblox();

//             // Ensure leaveTime is a string

//         if (typeof leaveTime !== 'string' || !leaveTime.trim()) {
//             return interaction.editReply({ content: 'Invalid leave time provided.', ephemeral: true });
//         }

//             // Add logging to check the values before passing them to setDescription
//             console.log(`User Tag: ${interaction.user.tag}`);
//             console.log(`Leave Time: ${leaveTime}`);

//             const id = interaction.user.id;
//             const rowifi = await getRowifi(id, client);

//             if (!rowifi.success) {
//                 return interactionEmbed(2, 'You must verify with RoWifi before using this command', '', interaction, client, [true, 45]);
//             }

//             const presenceCheck = await isUserInGame(rowifi.roblox);

//             if (!presenceCheck) {
//                 return interactionEmbed(2, 'You must be in Papers game to use this command!', '', interaction, client, [true, 45]);
//             }

//             const username = interaction.user.username;

//             const replacementEmbed = new EmbedBuilder()
//                 .setTitle('Replacement Request')
//                 .setDescription(`${interaction.user.tag} is leaving the game at ${leaveTime} and needs a replacement.`)
//                 .addFields(
//                     { name: 'Username', value: username },
//                     { name: 'Profile Link', value: `https://www.roblox.com/users/${rowifi.roblox}/profile` }
//                 )
//                 .setFooter({ text: 'Click Claim if you can replace this user.' })
//                 .setColor('Red');

//             const row = new ActionRowBuilder()
//                 .addComponents(
//                     new ButtonBuilder()
//                         .setCustomId('claim')
//                         .setLabel('Claim')
//                         .setEmoji("✅")
//                         .setStyle(ButtonStyle.Success),
//                     new ButtonBuilder()
//                         .setCustomId('deny')
//                         .setLabel('Deny')
//                         .setEmoji("💣")
//                         .setStyle(ButtonStyle.Danger)
//                 );

//             await interaction.editReply({ embeds: [replacementEmbed], components: [row] });

//         } catch (error) {
//             console.error('Error handling requestreplacement command: ', error);
//             await interaction.editReply({ content: 'An error occurred while processing your request. Please try again later.', ephemeral: true });
//         }
//     }
// };
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');
const noblox = require('noblox.js'); // Ensure noblox.js is installed and required
const { interactionEmbed, getRowifi } = require('../../functions');
const config = require('../../config.json')

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
            // Login to Roblox API
            await loginRoblox();

            // Get user ID from username
            const id = interaction.user.id;
 
            const rowifi = await getRowifi(id, client);

            if (!rowifi.success) {
              return interactionEmbed(2, 'You must verify with RoWifi before using this command', '', interaction, client, [true, 45]);
          }
         
          if(leaveTime < 5) return interaction.editReply(`<@!${interaction.user.id}> Must be greater than 5 minutes!`);
         
          const username = await noblox.getUsernameFromId(rowifi.roblox);
         
          console.log(rowifi.roblox);
            // Check if the user is in-game
            const isInGame = await isUserInGame(rowifi.roblox);
            if (!isInGame) {
                return interaction.editReply({ content: `**<@!${interaction.user.id}> must be in-game to request a replacement.**`, ephemeral: true });
            }

            await interaction.editReply(`<@&1270705578351788156> is requesting for replacement! GET READY YAYAYA!!!!`)
            const replacementEmbed = new EmbedBuilder()
                .setTitle('Replacement Request')
                .setDescription(`**<@!${interaction.user.id}> is leaving the game at ${leaveTime} and needs a replacement.**`)
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