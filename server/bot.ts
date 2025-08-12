import { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  EmbedBuilder,
  PermissionFlagsBits 
} from 'discord.js';
import { storage } from './storage';
import type { InsertUser, InsertServer, InsertRating } from '@shared/schema';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

async function ensureUserExists(discordUser: any): Promise<string> {
  let user = await storage.getUserByDiscordId(discordUser.id);
  
  if (!user) {
    const userData: InsertUser = {
      discordId: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator || '0000',
      avatarUrl: discordUser.displayAvatarURL()
    };
    user = await storage.createUser(userData);
  } else {
    // Update user info if it changed
    await storage.updateUser(user.id, {
      username: discordUser.username,
      discriminator: discordUser.discriminator || '0000',
      avatarUrl: discordUser.displayAvatarURL()
    });
  }
  
  return user.id;
}

async function ensureServerExists(discordGuild: any): Promise<string> {
  let server = await storage.getServerByDiscordId(discordGuild.id);
  
  if (!server) {
    const serverData: InsertServer = {
      discordServerId: discordGuild.id,
      name: discordGuild.name,
      iconUrl: discordGuild.iconURL(),
      memberCount: discordGuild.memberCount
    };
    server = await storage.createServer(serverData);
  } else {
    // Update server info
    await storage.updateServer(server.id, {
      name: discordGuild.name,
      iconUrl: discordGuild.iconURL(),
      memberCount: discordGuild.memberCount
    });
  }
  
  return server.id;
}

function getStarDisplay(rating: number): string {
  const filled = '⭐'.repeat(rating);
  const empty = '☆'.repeat(3 - rating);
  return filled + empty;
}

client.once('ready', async () => {
  console.log(`Discord bot logged in as ${client.user?.tag}!`);
  
  // Register slash commands
  const commands = [
    new SlashCommandBuilder()
      .setName('rate')
      .setDescription('Rate another user (1-3 stars)')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to rate')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('rating')
          .setDescription('Rating (1-3 stars)')
          .setRequired(true)
          .addChoices(
            { name: '1 Star - Poor', value: 1 },
            { name: '2 Stars - Good', value: 2 },
            { name: '3 Stars - Excellent', value: 3 }
          ))
      .addStringOption(option =>
        option.setName('comment')
          .setDescription('Optional comment')
          .setRequired(false)
          .setMaxLength(200)),
    
    new SlashCommandBuilder()
      .setName('rating')
      .setDescription('Check a user\'s rating')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to check (leave empty for yourself)')
          .setRequired(false)),
    
    new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('View top rated users'),
    
    new SlashCommandBuilder()
      .setName('moderate')
      .setDescription('Moderation commands (Admins only)')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand(subcommand =>
        subcommand
          .setName('remove')
          .setDescription('Remove a specific rating')
          .addUserOption(option =>
            option.setName('user')
              .setDescription('User whose ratings to manage')
              .setRequired(true)))
  ];

  try {
    await client.application?.commands.set(commands);
    console.log('Successfully registered Discord slash commands.');
  } catch (error) {
    console.error('Error registering Discord commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options, user, guild } = interaction;

  if (!guild) {
    await interaction.reply({ content: 'This bot only works in servers!', ephemeral: true });
    return;
  }

  try {
    switch (commandName) {
      case 'rate': {
        const targetUser = options.getUser('user', true);
        const rating = options.getInteger('rating', true);
        const comment = options.getString('comment');

        if (targetUser.id === user.id) {
          await interaction.reply({ content: '❌ You cannot rate yourself!', ephemeral: true });
          return;
        }

        if (targetUser.bot) {
          await interaction.reply({ content: '❌ You cannot rate bots!', ephemeral: true });
          return;
        }

        // Ensure users and server exist
        const raterUserId = await ensureUserExists(user);
        const ratedUserId = await ensureUserExists(targetUser);
        const serverId = await ensureServerExists(guild);

        // Check rate limiting
        const canRate = await storage.canUserRate(raterUserId, ratedUserId);
        if (!canRate) {
          await interaction.reply({ 
            content: '❌ You can only rate the same user once per 24 hours!', 
            ephemeral: true 
          });
          return;
        }

        // Create or update rate limit
        const existingLimit = await storage.getRateLimit(raterUserId, ratedUserId);
        if (existingLimit) {
          await storage.updateRateLimit(raterUserId, ratedUserId);
        } else {
          await storage.createRateLimit({
            userId: raterUserId,
            targetUserId: ratedUserId
          });
        }

        // Create the rating
        const ratingData: InsertRating = {
          ratedUserId,
          raterUserId,
          serverId,
          rating,
          comment: comment || undefined
        };

        await storage.createRating(ratingData);

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('✅ Rating Submitted!')
          .setDescription(`You rated **${targetUser.username}** ${getStarDisplay(rating)}`)
          .addFields(
            { name: 'Rating', value: `${rating}/3 stars`, inline: true },
            { name: 'Server', value: guild.name, inline: true }
          );

        if (comment) {
          embed.addFields({ name: 'Comment', value: comment });
        }

        embed.setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'rating': {
        const targetUser = options.getUser('user') || user;
        
        const dbUser = await storage.getUserByDiscordId(targetUser.id);
        if (!dbUser) {
          await interaction.reply({ 
            content: `❌ ${targetUser.username} hasn't been rated yet!`, 
            ephemeral: true 
          });
          return;
        }

        const userWithRatings = await storage.getUserWithRatings(dbUser.id);
        if (!userWithRatings) {
          await interaction.reply({ 
            content: `❌ ${targetUser.username} hasn't been rated yet!`, 
            ephemeral: true 
          });
          return;
        }

        const avgRating = parseFloat(userWithRatings.averageRating || '0');
        const starDisplay = avgRating > 0 ? getStarDisplay(Math.round(avgRating)) : 'No ratings yet';

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`📊 ${targetUser.username}'s Reputation`)
          .setThumbnail(targetUser.displayAvatarURL())
          .addFields(
            { name: 'Average Rating', value: `${starDisplay}\n${avgRating.toFixed(2)}/3.0`, inline: true },
            { name: 'Total Ratings', value: userWithRatings.totalRatings.toString(), inline: true },
            { name: 'Servers', value: `Active in ${userWithRatings.ratingsReceived.length > 0 ? 
              [...new Set(userWithRatings.ratingsReceived.map(r => r.server.name))].length : 0} servers`, inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'leaderboard': {
        const topUsers = await storage.getTopRatedUsers(10);
        
        if (topUsers.length === 0) {
          await interaction.reply({ content: '📊 No rated users yet! Be the first to start rating!', ephemeral: true });
          return;
        }

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('🏆 Top Rated Users')
          .setDescription('Users with the highest average ratings (minimum 5 ratings)')
          .setTimestamp();

        const leaderboard = topUsers.map((user, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          const avgRating = parseFloat(user.averageRating || '0');
          return `${medal} **${user.username}** - ${getStarDisplay(Math.round(avgRating))} (${avgRating.toFixed(2)}/3.0) - ${user.totalRatings} ratings`;
        }).join('\n');

        embed.setDescription(`${embed.data.description}\n\n${leaderboard}`);

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'moderate': {
        // Only server administrators can use moderation commands
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({ content: '❌ You need Administrator permissions to use this command!', ephemeral: true });
          return;
        }

        const subcommand = options.getSubcommand();
        
        if (subcommand === 'remove') {
          const targetUser = options.getUser('user', true);
          
          const dbUser = await storage.getUserByDiscordId(targetUser.id);
          if (!dbUser) {
            await interaction.reply({ content: '❌ User not found in the database!', ephemeral: true });
            return;
          }

          // This is a placeholder for rating removal functionality
          // In a full implementation, you'd want to add methods to remove specific ratings
          await interaction.reply({ 
            content: `⚠️ Moderation for ${targetUser.username} - This feature is under development. Contact the bot developer for manual intervention.`, 
            ephemeral: true 
          });
        }
        break;
      }

      default:
        await interaction.reply({ content: '❌ Unknown command!', ephemeral: true });
    }
  } catch (error) {
    console.error('Error handling Discord command:', error);
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: '❌ An error occurred while processing your command. Please try again later.', 
        ephemeral: true 
      });
    }
  }
});

client.on('guildCreate', async guild => {
  console.log(`Bot added to new server: ${guild.name} (${guild.id})`);
  await ensureServerExists(guild);
});

client.on('guildDelete', guild => {
  console.log(`Bot removed from server: ${guild.name} (${guild.id})`);
});

export async function startBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN environment variable is required');
  }

  await client.login(token);
}
