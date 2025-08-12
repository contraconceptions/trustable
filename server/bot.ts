import { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  EmbedBuilder,
  PermissionFlagsBits,
  ContextMenuCommandBuilder,
  ApplicationCommandType 
} from 'discord.js';
import { storage } from './storage';
import type { InsertUser, InsertServer, InsertRating } from '@shared/schema';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
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

function getRatingBadge(avgRating: number, totalRatings: number): string {
  if (totalRatings === 0) return '';
  
  const rating = Math.round(avgRating);
  if (rating >= 3 && totalRatings >= 10) return '🏆'; // Champion (3 stars, 10+ ratings)
  if (rating >= 3 && totalRatings >= 5) return '⭐'; // Gold star (3 stars, 5+ ratings)  
  if (rating >= 2 && totalRatings >= 5) return '🥈'; // Silver (2+ stars, 5+ ratings)
  if (rating >= 1 && totalRatings >= 3) return '🥉'; // Bronze (1+ stars, 3+ ratings)
  return '🆕'; // New player
}

function getRatingTitle(avgRating: number, totalRatings: number): string {
  if (totalRatings === 0) return 'Unrated';
  
  const rating = Math.round(avgRating);
  if (rating >= 3 && totalRatings >= 10) return 'Champion';
  if (rating >= 3 && totalRatings >= 5) return 'Gold Star Player';
  if (rating >= 2 && totalRatings >= 5) return 'Silver Player';
  if (rating >= 1 && totalRatings >= 3) return 'Bronze Player';
  return 'New Player';
}

client.once('ready', async () => {
  console.log(`Discord bot logged in as ${client.user?.tag}!`);
  
  // Set bot activity/presence
  if (client.user) {
    client.user.setActivity('reputation across servers', { type: 3 }); // Watching
  }
  
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
      .setName('profile')
      .setDescription('Show detailed user profile with rating history')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to view profile for (leave empty for yourself)')
          .setRequired(false)),
    
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
              .setRequired(true))),
    
    // Context menu command for quick rating checks
    new ContextMenuCommandBuilder()
      .setName('Check Rating')
      .setType(ApplicationCommandType.User)
  ];

  try {
    await client.application?.commands.set(commands);
    console.log('Successfully registered Discord slash commands.');
  } catch (error) {
    console.error('Error registering Discord commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isUserContextMenuCommand()) return;

  const { user, guild } = interaction;

  if (!guild) {
    await interaction.reply({ content: 'This bot only works in servers!', ephemeral: true });
    return;
  }

  try {
    // Handle context menu commands
    if (interaction.isUserContextMenuCommand()) {
      if (interaction.commandName === 'Check Rating') {
        const targetUser = interaction.targetUser;
        
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
        const badge = getRatingBadge(avgRating, userWithRatings.totalRatings);
        const title = getRatingTitle(avgRating, userWithRatings.totalRatings);
        const starDisplay = avgRating > 0 ? getStarDisplay(Math.round(avgRating)) : 'No ratings yet';

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`${badge} ${targetUser.username}'s Reputation`)
          .setThumbnail(targetUser.displayAvatarURL())
          .addFields(
            { name: 'Title', value: title, inline: true },
            { name: 'Rating', value: `${starDisplay} (${avgRating.toFixed(1)}/3.0)`, inline: true },
            { name: 'Total Ratings', value: userWithRatings.totalRatings.toString(), inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
    }

    // Handle slash commands
    if (!interaction.isChatInputCommand()) return;
    
    const { commandName, options } = interaction;
    
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
        const badge = getRatingBadge(avgRating, userWithRatings.totalRatings);
        const title = getRatingTitle(avgRating, userWithRatings.totalRatings);
        const starDisplay = avgRating > 0 ? getStarDisplay(Math.round(avgRating)) : 'No ratings yet';

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`${badge} ${targetUser.username}'s Reputation`)
          .setDescription(`**${title}**`)
          .setThumbnail(targetUser.displayAvatarURL())
          .addFields(
            { name: 'Rating', value: `${starDisplay}\n${avgRating.toFixed(2)}/3.0`, inline: true },
            { name: 'Total Ratings', value: userWithRatings.totalRatings.toString(), inline: true },
            { name: 'Servers', value: `Active in ${userWithRatings.ratingsReceived.length > 0 ? 
              Array.from(new Set(userWithRatings.ratingsReceived.map(r => r.server.name))).length : 0} servers`, inline: true }
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
          const badge = getRatingBadge(avgRating, user.totalRatings);
          const title = getRatingTitle(avgRating, user.totalRatings);
          return `${medal} ${badge} **${user.username}** - ${getStarDisplay(Math.round(avgRating))} (${avgRating.toFixed(2)}/3.0)\n   *${title}* • ${user.totalRatings} ratings`;
        }).join('\n\n');

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

      case 'profile': {
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
        const badge = getRatingBadge(avgRating, userWithRatings.totalRatings);
        const title = getRatingTitle(avgRating, userWithRatings.totalRatings);
        
        // Get recent ratings received (last 5)
        const recentRatings = userWithRatings.ratingsReceived
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`${badge} ${targetUser.username}'s Gaming Profile`)
          .setDescription(`**${title}**\n${avgRating > 0 ? getStarDisplay(Math.round(avgRating)) : 'No ratings yet'} ${avgRating.toFixed(2)}/3.0`)
          .setThumbnail(targetUser.displayAvatarURL())
          .addFields(
            { name: '📊 Stats', value: `**${userWithRatings.totalRatings}** ratings\n**${Array.from(new Set(userWithRatings.ratingsReceived.map(r => r.server.name))).length}** servers`, inline: true },
            { name: '📈 Breakdown', value: `⭐⭐⭐ ${userWithRatings.ratingsReceived.filter(r => r.rating === 3).length}\n⭐⭐ ${userWithRatings.ratingsReceived.filter(r => r.rating === 2).length}\n⭐ ${userWithRatings.ratingsReceived.filter(r => r.rating === 1).length}`, inline: true },
            { name: '📅 Member Since', value: `<t:${Math.floor(new Date(userWithRatings.createdAt).getTime() / 1000)}:R>`, inline: true }
          );

        if (recentRatings.length > 0) {
          const recentText = recentRatings.map(r => 
            `${getStarDisplay(r.rating)} ${r.comment ? `"${r.comment.slice(0, 50)}${r.comment.length > 50 ? '...' : ''}"` : 'No comment'} - *${r.server.name}*`
          ).join('\n');
          embed.addFields({ name: '💭 Recent Feedback', value: recentText });
        }

        embed.setTimestamp();
        await interaction.reply({ embeds: [embed] });
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
