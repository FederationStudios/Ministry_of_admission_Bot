const { SlashCommandBuilder, Client, CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, Colors } = require("discord.js");
const { getRowifi, interactionEmbed } = require("../../functions");
const nbx = require("noblox.js");
const { requiredRoles } = require("../../config.json");

module.exports = {
  name: "rowificheck",
  description: "Gives you back the rowifi details.",
  data: new SlashCommandBuilder()
    .setName("rowificheck")
    .setDescription("Gives you back the rowifi details")
    .addUserOption(option => {
      return option
        .setName("user")
        .setDescription("Select the user to check RoWifi details for")
        .setRequired(true);
    })
    .addBooleanOption(option => {
      return option  
        .setName("ephemeral")
        .setDescription("Whether or not the response should be ephemeral");
    }),

  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  
  run: async (client, interaction) => {
    try {
        // Defer the reply as this might take time
        await interaction.deferReply({ ephemeral: true });
        // Check if the user has appropriate permissions (CoA Leadership)

        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
          return interactionEmbed(3, "[ERR-UPRM]", `You do not have permission to run this command, buddy.`, interaction, client, [true, 30]);
        }
        const user = interaction.options.getUser("user");
        const id = user.id; // Extract the Discord ID from the selected user
        const bol = interaction.options.getBoolean("ephemeral");
        const rowifi = await getRowifi(id, client);

        const embed = new EmbedBuilder({
            title: "Rowifi Status",
            fields: [
                {
                    name: "RoWifi Link",
                    value: !rowifi.success ? `\`❌\` No, ${rowifi.error}` : `\`✅\` Yes, ${rowifi.roblox}`,
                    inline: false
                },
                {
                    name: "Discord ID",
                    value: `${id}`,
                    inline: false
                }
            ],
            footer: {
                text: `⚠ MoA - Secure Transmission at ${new Date().toLocaleTimeString()} ${new Date().toString().match(/GMT([+-]\d{2})(\d{2})/)[0]}`,
                iconURL: client.user.displayAvatarURL()
            }
        }).setColor(Colors.DarkNavy);

        if (!isNaN(rowifi.roblox)) {
            let info = await nbx.getPlayerInfo(rowifi.roblox);
            embed.addFields({ name: "Details Found:", value: `**Roblox Username: **${info.username}\n**Roblox Join Date: **${info.joinDate.toDateString()}` });
            embed.addFields({ name: "Roblox Profile Link:", value: `https://www.roblox.com/users/${rowifi.roblox}/profile` });
        }

        // Edit the deferred reply
        await interaction.editReply({ content: "Rowifi Status", embeds: [embed], ephemeral: bol });
    } catch (error) {
        console.error(error);
        // In case of an error, reply with an error message if the interaction hasn't been replied to yet
        if (!interaction.replied) {
            await interaction.followUp({ content: "An error occurred while processing your request.", ephemeral: true });
        }
    }
 }
}