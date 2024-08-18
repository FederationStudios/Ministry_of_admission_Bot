 
// eslint-disable no-undef
const { CommandInteraction, SlashCommandBuilder } = require("discord.js");
const { paginationEmbed, getRowifi, interactionEmbed } = require("../../functions.js");
const { requiredRoles } = require("../../config.json");

module.exports = {
  name: "banlist",
  description: "Fetch the list of banned users and check their RoWifi status.",
  data: new SlashCommandBuilder()
    .setName("banlist")
    .setDescription("Fetch the list of banned users and check their RoWifi status."),
  /**
   * @param {CommandInteraction} interaction
   */
  async run(interaction) {
    try {
      await interaction.deferReply();

      // Check if the user has appropriate permissions 
      const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
      if (!hasRole) {
        return interactionEmbed(3, "[ERR-UPRM]", `You do not have permission to run this command, buddy.`, interaction, client, [true, 30]);
      }

      const banList = await interaction.guild.bans.fetch();

      if (!banList.size) {
        return interaction.editReply("No banned users found in this server.");
      }

      const banInfo = [];
      for (const [userId, ban] of banList) {
        const robloxStatus = await getRowifi(ban.user.id);
        const robloxUsername = robloxStatus ? robloxStatus.username : "Not linked";

        banInfo.push({
          name: ban.user.tag,
          value: `**Reason:** ${ban.reason || "No reason provided"}\n**RoWifi Status:** ${robloxUsername}`,
        });
      }

      const embedPages = [];
      const itemsPerPage = 5;
      for (let i = 0; i < banInfo.length; i += itemsPerPage) {
        const current = banInfo.slice(i, i + itemsPerPage);
        embedPages.push({
          title: "Banned Users List",
          fields: current,
          footer: { text: `Page ${Math.ceil(i / itemsPerPage) + 1} of ${Math.ceil(banInfo.length / itemsPerPage)}` },
          timestamp: new Date(),
        });
      }

      await paginationEmbed(interaction, embedPages);
    } catch (error) {
      console.error(`[ERROR] ${error}`);
      interaction.editReply("An error occurred while fetching the ban list.");
    }
  }
};
