// eslint-disable-next-line no-unused-vars
const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");
const { paginationEmbed, getRowifi } = require("../../functions.js");

module.exports = {
  name: "banlist",
  description: "Fetch the list of banned users and check their RoWifi status.",
  data: new SlashCommandBuilder()
    .setName("banlist")
    .setDescription("Fetch the list of banned users and check their RoWifi status."),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
  async run(client, interaction) {
    try {
      await interaction.deferReply();

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
