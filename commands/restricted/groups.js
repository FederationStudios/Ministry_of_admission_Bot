// eslint-disable-next-line no-unused-vars
const { Client, CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { interactionEmbed, paginationEmbed } = require("../../functions.js");
const nbx = require("noblox.js");

module.exports = {
  name: "groups",
  description: "Shows all the groups that the user is in",
  data: new SlashCommandBuilder()
    .setName("groups")
    .setDescription("Shows all the groups that the user is in")
    .addStringOption(option =>
      option
        .setName("username")
        .setDescription("Use a roblox username")
        .setRequired(true)
    ),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  run: async (client, interaction, options) => {
    await interaction.deferReply();
    const robloxuser = options.getString("username");
    let robloxid;

    try {
      robloxid = await nbx.getIdFromUsername(robloxuser);
    } catch (error) {
      return interactionEmbed(3, "[ERR-ARGS]", `Interpreted \`${robloxuser}\` as username but found no user`, interaction, client, [true, 15]);
    }

    let groups;
    try {
      groups = await nbx.getGroups(robloxid);
    } catch (error) {
      return interactionEmbed(3, "[ERR-FETCH]", `Failed to fetch groups for **${robloxuser}**. Please try again later.`, interaction, client, [true, 15]);
    }

    if (!groups || groups.length === 0) {
      return interactionEmbed(3, "[ERR-MISS]", `**${robloxuser}** is not in any group.`, interaction, client, [true, 15]);
    }

    const embedPages = [];
    let currentEmbed = new EmbedBuilder()
     .setColor("Red")
      .setTitle(`**${robloxuser}**'s Groups:`)
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      });

    groups.forEach((group, index) => {
      currentEmbed.addFields({ name: group.Name, value: group.Role, inline: true });

      // Create a new embed after every 20 fields (Discord limit for fields per embed is 25)
      if ((index + 1) % 20 === 0) {
        embedPages.push(currentEmbed);
        currentEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle(`**${robloxuser}**'s Groups:`)
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          });
      }
    });

    // Add the last embed if it has content
    if (currentEmbed.data.fields.length > 0) {
      embedPages.push(currentEmbed);
    }

    await paginationEmbed(interaction, embedPages);
  }
};
