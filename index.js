// eslint-disable no-undef
 

const { Client, GatewayIntentBits, InteractionType, ActivityType, Collection, EmbedBuilder } = require("discord.js");
const { ApplicationCommandOptionType } = require("discord-api-types/v10");
const { interactionEmbed, toConsole, getRowifi } = require("./functions.js");
const fs = require("node:fs");
const noblox = require('noblox.js');
const config = require("./config.json");
const fetch = require('node-fetch');
let ready = false;
const path = require("path");
const { roleIdsToCheck } = require('./config.json');


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages] });
client.commands = new Collection();
client.modals = new Collection();

//#region Events
client.once("ready", async () => {
  // Start of Bot Status
  client.user.setActivity("All memebrs!", { type: ActivityType.Watching });
  //End of bot status


  //Commands
  const loadCommands = (folderPath, type) => {
    console.log(`[CMD-LOAD] Loading from folder: ${folderPath}`);
    const commandsArray = [];
    const commands = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));
    for (const command of commands) {
      try {
        console.log(`[CMD-LOAD] ${path.join(folderPath,command)}`);
        const cmd = require(path.join(folderPath, command));

        if(cmd.data.description !== "" && cmd.data.description !== undefined) cmd.data.description = `[${type}] ${cmd.data.description}`;

        client.commands.set(cmd.name, cmd);
        commandsArray.push(cmd.data.toJSON());
        console.info(`[CMD-LOAD] Loaded command ${cmd.name}`);
      } catch (e) {
        console.error(`[CMD-LOAD] Failure while loading command: ${command}\n`);
        console.error(e);
      }
    }

    return commandsArray;
  };

  const globalCommands = loadCommands(path.join(__dirname, "commands", "public"),"PUBLIC");
  const fisaCommands = loadCommands(path.join(__dirname, "commands", "restricted"), "STAFF");

  //Modals
  const modals = fs.readdirSync("./modals").filter(file => file.endsWith(".js"));
  console.info(`[MDL-LOAD] Loading modals, expecting ${modals.length} modals`);
  for (let file of modals) {
    try {
      console.info(`[MDL-LOAD] Loading file ${file}`);
      let modal = require(`./modals/${file}`);

      if (modal.name) {
        console.info(`[MDL-LOAD] Loaded: ${file}`);
        client.modals.set(modal.name, modal);
      }
    } catch (e) {
      console.warn(`[MDL-LOAD] Unloaded: ${file}`);
      console.warn(`[MDL-LOAD] ${e}`);
    }
  }
  console.info("[MDL-LOAD] Loaded modals");

  await client.application.commands.set(globalCommands); //global commands (punishmentsubmission and backgroundcheckrequest)

  await client.guilds.cache.get("1266109471944478831").commands.set(fisaCommands); // guild commands for FS Automations (includes the rest of the commands)
  await client.guilds.cache.get("1266109471944478831").commands.set(fisaCommands); // this should be for FSS, suman add the FSS guild id here
  ready = true;
  toConsole("Client has logged in and is ready", new Error().stack, client);

});

client.on("interactionCreate", async interaction => {
  if (!ready) return interaction.reply({ content: "Do not send commands, the bot is starting!" });
  switch (interaction.type) {
  case InteractionType.ApplicationCommand: {
    const command = client.commands.get(interaction.commandName);
    if (command) {
     
      const ack = command.run(client, interaction, interaction.options)
        .catch((e) => {
          interaction.editReply({ content: "Something went wrong while executing the command. You have given wrong inputs or if you think it's a problem then please report this to a developer", components: [] });
          return toConsole(e.stack, new Error().stack, client);
        });

      let option = [];
      if (interaction.options.type) {
        switch (interaction.options.data[0].type) {
        case ApplicationCommandOptionType.SubcommandGroup: {
          for (let op of interaction.options.data[0].options[0].options) {
            option.push(`[${ApplicationCommandOptionType[op.type]}] ${op.name}: ${op.value}`);
          }
          break;
        }
        case ApplicationCommandOptionType.Subcommand: {
          for (let op of interaction.options.data[0].options) {
            option.push(`[${ApplicationCommandOptionType[op.type]}] ${op.name}: ${op.value}`);
          }
          break;
        }
        }
      } else {
        for (let op of interaction.options.data) {
          option.push(`[${ApplicationCommandOptionType[op.type]}] ${op.name}: ${op.value}`);
        }
      }
      toConsole(`${interaction.user.tag} (${interaction.user.id}) ran the command \`${interaction.commandName}\` with the following options:\n> ${option.join("\n> ") || "No options"}`, new Error().stack, client);
      await require("node:util").promisify(setTimeout)(1e4);
      if (ack !== null) return; // Already executed
      interaction.fetchReply()
        .then(m => {
          if (m.content === "" && m.embeds.length === 0) interactionEmbed(3, "[ERR-UNK]", "The command timed out and failed to reply in 10 seconds", interaction, client, [true, 15]);
        });
    }
  }
  }
  if (interaction.isModalSubmit()) {
    // modals need to have the same name as the commands they are started with
    const modalName = interaction.customId;
    const modal = client.modals.get(modalName);
    if (modal) {
      modal.run(client, interaction, interaction.fields);
    } else {
      await interaction.reply("Modal not found.");
      console.warn(`No modal found for: ${modalName}`);
      toConsole(`No modal found for: ${modalName}`,new Error().stack,client);
    }
  }
  if(interaction.isMessageContextMenuCommand())
  {
    const command = client.commands.get(interaction.commandName);
    command.run(client, interaction);

  }
  if(interaction.isAutocomplete()){
    const command = client.commands.get(interaction.commandName);
    await command.autocomplete(interaction);
  }
});
//#endregion

//#region DM handling
const claimedRequests = new Map();
// Roblox cookie from config
const robloxCookie = config.robloxCookie;
// Login function for Roblox
async function loginRoblox() {
    await noblox.setCookie(robloxCookie); 
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

// Log in to Roblox on bot startup
loginRoblox().catch(console.error);

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const requestId = interaction.message.id;
  const claimant = interaction.user;
  const requesterId = interaction.message.interaction.user.id;

  if (interaction.customId === 'claim') {
      // Prevent the user from claiming their own request
      if (claimant.id === requesterId) {
          return interaction.reply({ content: '**You cannot claim your own request.**', ephemeral: true });
      }

      // Check if the request has already been claimed
      if (claimedRequests.has(requestId)) {
          return interaction.reply({ content: 'This request has already been claimed.', ephemeral: true });
      }

      // Check if the user is in-game on Roblox
      const rowifi = await getRowifi(claimant.id, client); // Assuming claimant.tag is the Roblox username
      if (!rowifi.success) {
        return interaction.reply({ content: 'You must be verified with rowifi lol!', ephemeral: true  });
    }
    const robloxId = rowifi.roblox;
    console.log(rowifi.username);
      const inGame = await isUserInGame(robloxId);

      if (!inGame) {
          return interaction.reply({ content: 'You must be in-game on Roblox to claim this request.', ephemeral: true });
      }

      // Mark this request as claimed by the user
      claimedRequests.set(requestId, claimant.id);

      // Acknowledge the button press by updating the interaction message
      await interaction.update({ content: `Replacement claimed by ${claimant.tag}. Please check your DMs to verify your attendance.`, components: [] });

      const dmEmbed = new EmbedBuilder()
          .setTitle('Waiting for image')
          .setDescription(`Before you can claim this replacement request, you need to send an image of you in-game to verify your attendance. Upload the picture here or use a link from Lightshot, Gyazo, or Discord Media.`)
          .setColor('Red');

      try {
          const dmChannel = await claimant.createDM();
          const dmMessage = await dmChannel.send({ embeds: [dmEmbed] });

          // Define the filter for message collection
          const filter = message => message.author.id === claimant.id;
          const collector = dmChannel.createMessageCollector({ filter, max: 1, time: 60000 });

          collector.on('collect', async message => {
              if (message.attachments.size > 0 || message.content.match(/https?:\/\/\S+/)) {
                  // Send image to a specific channel
                  const targetChannel = client.channels.cache.get(config.commandUsage); // Replace with your channel ID
                  if (targetChannel) {
                      await targetChannel.send({ content: `${claimant.tag} sent an image for verification:`, files: Array.from(message.attachments.values()) });
                  }

                  // Confirm the replacement
                  await dmChannel.send('Thank you! Your attendance has been verified.');
              } else {
                  await dmChannel.send('Invalid image or link. Please send a valid image or link.');
              }
          });

          collector.on('end', collected => {
              if (collected.size === 0) {
                  dmChannel.send('Time expired. Please try claiming the request again.');
              }
          });
      } catch (error) {
          console.error('Error sending DM: ', error);
      }
  }

  if (interaction.customId === 'deny') {
      // Check if the person denying the request is the original requester
      if (claimant.id !== requesterId) {
          return interaction.reply({ content: 'You cannot deny this request. Only the original requester can deny it.', ephemeral: true });
      }

      // Use interaction.update to remove buttons
      if (!interaction.replied && !interaction.deferred) {
          await interaction.update({ content: 'Replacement request denied.', components: [] });
      }

      // Remove the claim status if it was claimed
      claimedRequests.delete(requestId);
  }
});

//#region Leaving guild
client.on('guildMemberRemove', async (member) => {
  console.log(`Member left: ${member.user.tag}`); // Debugging: Confirm member leave event

  const hasRole = member.roles.cache.some(role => roleIdsToCheck.includes(role.id));
  
  console.log(`Has specific role: ${hasRole}`); // Debugging: Confirm role check

  if (hasRole) {
      console.log('Member has specific role, checking RoWifi status...'); // Debugging

      // Fetch Rowifi data for the member
      const rowifiData = await getRowifi(member.id, client);
      
      console.log(`RoWifi data: ${JSON.stringify(rowifiData)}`); // Debugging: Print Rowifi data

      let robloxInfo = 'did not have linked with RoWifi';

      if (rowifiData.success) {
          robloxInfo = `has linked with RoWifi as ${rowifiData.username} (Roblox ID: ${rowifiData.roblox})`;
      }

      // Send a message to the log channel
      const logChannel = member.guild.channels.cache.get(config.leaveChannelLog); 
      if (logChannel) {
          logChannel.send(`⚠️ **${member.user.tag}** (${member.id}) with specific roles has left the server and ${robloxInfo}.`);
      } else {
          console.error('Log channel not found.'); // Debugging: Confirm if log channel exists
      }

      console.log(`RoWifi status: ${robloxInfo}`); // Debugging
  }
});


client.login(config.token);

//#region Error Handling
process.on("uncaughtException", (err, origin) => {
  if (!ready) {
    console.warn("Exiting due to a [uncaughtException] during start up");
    console.error(err, origin);
    return process.exit(14);
  }
  // eslint-disable-next-line no-useless-escape
  toConsole(`An [uncaughtException] has occurred.\n\n> ${String(err)}\n> ${String(origin).replaceAll(/:/g, "\:")}`, new Error().stack, client);
});
process.on("unhandledRejection", async (promise) => {
  if (!ready) {
    console.warn("Exiting due to a [unhandledRejection] during start up");
    console.error(promise);
    return process.exit(15);
  }
  if (String(promise).includes("Interaction has already been acknowledged.") || String(promise).includes("Unknown interaction") || String(promise).includes("Unknown Message") || String(promise).includes("Cannot read properties of undefined (reading 'ephemeral')")) return client.channels.cache.get(config.logchannelid).send(`A suppressed error has occured at process.on(unhandledRejection):\n>>> ${promise}`);
  // eslint-disable-next-line no-useless-escape
  toConsole(`An [unhandledRejection] has occurred.\n\n> ${String(promise).replaceAll(/:/g, "\:")}`, new Error().stack, client);
});
process.on("warning", async (warning) => {
  if (!ready) {
    console.warn("[warning] has occurred during start up");
    console.warn(warning);
  }
  toConsole(`A [warning] has occurred.\n\n> ${warning}`, new Error().stack, client);
});
process.on("exit", (code) => {
  console.error("[EXIT] The process is exiting!");
  console.error(`[EXIT] Code: ${code}`);

});
//#endregion