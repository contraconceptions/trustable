import { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  EmbedBuilder,
  PermissionFlagsBits,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  AttachmentBuilder,
  Collection
} from 'discord.js';
import { storage } from './storage';
import type { InsertUser, InsertServer, InsertRating } from '@shared/schema';
import { logger } from './logger';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Store for cooldowns and temporary data
const rateCooldowns = new Collection();
const ratingInProgress = new Collection();

// Clean up old cooldowns every hour
setInterval(() => {
  const oneHour = 60 * 60 * 1000;
  const now = Date.now();
  rateCooldowns.sweep((value, key) => now - value > oneHour);
  ratingInProgress.sweep((value, key) => now - value > oneHour);
}, 60 * 60 * 1000);

async function ensureUserExists(discordUser: any): Promise<string> {
  let user = await storage.getUserByDiscordId(discordUser.id);

  if (!user) {
    logger.info(`User ${discordUser.tag} (${discordUser.id}) not found, creating new record.`);
    const userData: InsertUser = {
      discordId: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator || '0000',
      avatarUrl: discordUser.displayAvatarURL() || null
    };
    user = await storage.createUser(userData);
    logger.info(`Created new user record for ${discordUser.tag} (${user.id})`);
  } else {
    // Update user info if it changed
    logger.debug(`Updating user record for ${discordUser.tag} (${user.id})`);
    await storage.updateUser(user.id, {
      username: discordUser.username,
      discriminator: discordUser.discriminator || '0000',
      avatarUrl: discordUser.displayAvatarURL() || null
    });
    logger.debug(`User record updated for ${discordUser.tag} (${user.id})`);
  }

  return user.id;
}

async function ensureServerExists(discordGuild: any): Promise<string> {
  let server = await storage.getServerByDiscordId(discordGuild.id);

  if (!server) {
    logger.info(`Server ${discordGuild.name} (${discordGuild.id}) not found, creating new record.`);
    const serverData: InsertServer = {
      discordServerId: discordGuild.id,
      name: discordGuild.name,
      iconUrl: discordGuild.iconURL() || null,
      memberCount: discordGuild.memberCount || 0
    };
    server = await storage.createServer(serverData);
    logger.info(`Created new server record for ${discordGuild.name} (${server.id})`);
  } else {
    // Update server info
    logger.debug(`Updating server record for ${discordGuild.name} (${server.id})`);
    await storage.updateServer(server.id, {
      name: discordGuild.name,
      iconUrl: discordGuild.iconURL() || null,
      memberCount: discordGuild.memberCount || 0
    });
    logger.debug(`Server record updated for ${discordGuild.name} (${server.id})`);
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

function createProgressBar(current: number, max: number, length: number = 10): string {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function createQuickRatingButtons(targetUserId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`quick_rate_1_${targetUserId}`)
        .setLabel('⭐ Poor')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quick_rate_2_${targetUserId}`)
        .setLabel('⭐⭐ Good')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quick_rate_3_${targetUserId}`)
        .setLabel('⭐⭐⭐ Excellent')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`detailed_rate_${targetUserId}`)
        .setLabel('📝 Detailed Rating')
        .setStyle(ButtonStyle.Secondary)
    );
}

function createRatingModal(targetUserId: string): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(`rating_modal_${targetUserId}`)
    .setTitle('🌟 Detailed Player Rating');

  const ratingInput = new TextInputBuilder()
    .setCustomId('rating_value')
    .setLabel('Rating (1-3 stars)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter 1, 2, or 3')
    .setMinLength(1)
    .setMaxLength(1)
    .setRequired(true);

  const categoryInput = new TextInputBuilder()
    .setCustomId('rating_category')
    .setLabel('What are you rating? (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., Teamwork, Communication, Skill, Attitude')
    .setRequired(false);

  const commentInput = new TextInputBuilder()
    .setCustomId('rating_comment')
    .setLabel('Comments (Optional)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Share your experience with this player...')
    .setMaxLength(500)
    .setRequired(false);

  const interactionInput = new TextInputBuilder()
    .setCustomId('interaction_context')
    .setLabel('Where did you interact? (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., Voice chat, game lobby, tournament')
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(ratingInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(commentInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(interactionInput)
  );

  return modal;
}

async function handleQuickRating(interaction: any, targetUser: any, rating: number, raterUser: any, guild: any, comment?: string) {
  try {
    // Ensure users and server exist
    const raterUserId = await ensureUserExists(raterUser);
    const ratedUserId = await ensureUserExists(targetUser);
    const serverId = await ensureServerExists(guild);

    // Check rate limiting
    const canRate = await storage.canUserRate(raterUserId, ratedUserId);
    if (!canRate) {
      logger.warn(`Rate limit exceeded for user ${raterUser.id} rating ${targetUser.id} in guild ${guild.id}`);
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
    logger.info(`User ${raterUser.id} rated ${targetUser.id} (${rating} stars) in guild ${guild.id}`);

    // Create the rating
    const ratingData: InsertRating = {
      ratedUserId,
      raterUserId,
      serverId,
      rating,
      comment: comment || undefined
    };

    await storage.createRating(ratingData);

    // Get updated stats for progress bar
    const userWithRatings = await storage.getUserWithRatings(ratedUserId);
    const avgRating = parseFloat(userWithRatings?.averageRating || '0');
    const totalRatings = userWithRatings?.totalRatings || 0;
    const badge = getRatingBadge(avgRating, totalRatings);
    const title = getRatingTitle(avgRating, totalRatings);

    const embed = new EmbedBuilder()
      .setColor(rating === 3 ? 0x57F287 : rating === 2 ? 0x5865F2 : 0xED4245)
      .setTitle(`✅ Rating Submitted!`)
      .setDescription(`You rated **${targetUser.username}** ${getStarDisplay(rating)}`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: 'Your Rating', value: `${getStarDisplay(rating)} (${rating}/3)`, inline: true },
        { name: 'Their New Average', value: `${badge} ${avgRating.toFixed(1)}/3.0`, inline: true },
        { name: 'Total Ratings', value: totalRatings.toString(), inline: true }
      )
      .setFooter({ text: `Server: ${guild.name} • ${title}` })
      .setTimestamp();

    if (comment) {
      embed.addFields({ name: 'Your Comment', value: comment });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error(`Error in handleQuickRating for user ${raterUser.id} rating ${targetUser.id} in guild ${guild.id}: ${error}`);
    await interaction.reply({ 
      content: '❌ An error occurred while submitting your rating. Please try again.', 
      ephemeral: true 
    });
  }
}

async function handleDetailedRating(interaction: any, targetUser: any, rating: number, comment: string, raterUser: any, guild: any) {
  try {
    // Ensure users and server exist
    const raterUserId = await ensureUserExists(raterUser);
    const ratedUserId = await ensureUserExists(targetUser);
    const serverId = await ensureServerExists(guild);

    // Check rate limiting
    const canRate = await storage.canUserRate(raterUserId, ratedUserId);
    if (!canRate) {
      logger.warn(`Rate limit exceeded for user ${raterUser.id} rating ${targetUser.id} in guild ${guild.id}`);
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
    logger.info(`User ${raterUser.id} submitted detailed rating for ${targetUser.id} (${rating} stars) in guild ${guild.id}`);

    // Create the rating
    const ratingData: InsertRating = {
      ratedUserId,
      raterUserId,
      serverId,
      rating,
      comment: comment || undefined
    };

    await storage.createRating(ratingData);

    // Get updated stats for comprehensive feedback
    const userWithRatings = await storage.getUserWithRatings(ratedUserId);
    const avgRating = parseFloat(userWithRatings?.averageRating || '0');
    const totalRatings = userWithRatings?.totalRatings || 0;
    const badge = getRatingBadge(avgRating, totalRatings);
    const title = getRatingTitle(avgRating, totalRatings);
    const progressToNext = createProgressBar(avgRating, 3, 12);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🌟 Detailed Rating Submitted!`)
      .setDescription(`Thank you for providing detailed feedback about **${targetUser.username}**`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: '⭐ Your Rating', value: `${getStarDisplay(rating)} (${rating}/3 stars)`, inline: true },
        { name: '📊 New Average', value: `${avgRating.toFixed(2)}/3.0`, inline: true },
        { name: '🏆 Current Title', value: `${badge} ${title}`, inline: true },
        { name: '📈 Rating Progress', value: `${progressToNext}\n${totalRatings} total ratings`, inline: false }
      )
      .setFooter({ text: `Server: ${guild.name} • Community Building` })
      .setTimestamp();

    if (comment) {
      embed.addFields({ 
        name: '💭 Your Detailed Feedback', 
        value: comment.length > 1000 ? comment.substring(0, 1000) + '...' : comment 
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error(`Error in handleDetailedRating for user ${raterUser.id} rating ${targetUser.id} in guild ${guild.id}: ${error}`);
    await interaction.reply({ 
      content: '❌ An error occurred while submitting your detailed rating. Please try again.', 
      ephemeral: true 
    });
  }
}

client.once('ready', async () => {
  logger.info(`Discord bot logged in as ${client.user?.tag}!`);

  // Set bot activity/presence
  if (client.user) {
    client.user.setActivity('reputation across servers', { type: 3 }); // Watching
  }

  // Register slash commands
  const commands = [
    new SlashCommandBuilder()
      .setName('rate')
      .setDescription('🌟 Rate another player with interactive buttons or detailed form')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The player to rate')
          .setRequired(true)),

    new SlashCommandBuilder()
      .setName('quickrate')
      .setDescription('⚡ Quick rating with preset options')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The player to rate')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('rating')
          .setDescription('Rating (1-3 stars)')
          .setRequired(true)
          .addChoices(
            { name: '⭐ Poor - Negative experience', value: 1 },
            { name: '⭐⭐ Good - Positive experience', value: 2 },
            { name: '⭐⭐⭐ Excellent - Outstanding player', value: 3 }
          ))
      .addStringOption(option =>
        option.setName('comment')
          .setDescription('Quick comment (optional)')
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
      .setDescription('🏆 View the top-rated users across all servers'),

    new SlashCommandBuilder()
      .setName('mystats')
      .setDescription('📈 View your personal rating statistics and activity'),

    new SlashCommandBuilder()
      .setName('serverstats')
      .setDescription('🏠 View rating statistics for this server'),

    new SlashCommandBuilder()
      .setName('profile')
      .setDescription('👤 Show detailed user profile with rating history')
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
    logger.info('Successfully registered Discord slash commands.');
  } catch (error) {
    logger.error(`Error registering Discord commands: ${error}`);
  }
});

client.on('interactionCreate', async interaction => {
  const { user, guild } = interaction;

  // Skip autocomplete interactions as they don't need guild checks
  if (interaction.isAutocomplete()) {
    return;
  }

  if (!guild) {
    if (interaction.isRepliable()) {
      await interaction.reply({ content: 'This bot only works in servers!', ephemeral: true });
    }
    return;
  }

  try {
    // Handle button interactions
    if (interaction.isButton()) {
      const customId = interaction.customId;

      if (customId.startsWith('quick_rate_')) {
        const [, , rating, targetUserId] = customId.split('_');
        const targetUser = await client.users.fetch(targetUserId);

        if (!targetUser) {
          logger.warn(`Target user ${targetUserId} not found for quick rate button.`);
          await interaction.reply({ content: '❌ User not found!', ephemeral: true });
          return;
        }

        await handleQuickRating(interaction, targetUser, parseInt(rating), user, guild);
        return;
      }

      if (customId.startsWith('detailed_rate_')) {
        const targetUserId = customId.split('_')[2];
        const modal = createRatingModal(targetUserId);
        await interaction.showModal(modal);
        return;
      }
      return;
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('rating_modal_')) {
        const targetUserId = interaction.customId.split('_')[2];
        const targetUser = await client.users.fetch(targetUserId);

        const rating = parseInt(interaction.fields.getTextInputValue('rating_value'));
        const category = interaction.fields.getTextInputValue('rating_category') || '';
        const comment = interaction.fields.getTextInputValue('rating_comment') || '';
        const context = interaction.fields.getTextInputValue('interaction_context') || '';

        if (!targetUser) {
          logger.warn(`Target user ${targetUserId} not found for modal submission.`);
          await interaction.reply({ content: '❌ User not found!', ephemeral: true });
          return;
        }

        if (isNaN(rating) || rating < 1 || rating > 3) {
          logger.warn(`Invalid rating submitted: ${rating}`);
          await interaction.reply({ content: '❌ Please enter a valid rating (1, 2, or 3)!', ephemeral: true });
          return;
        }

        const fullComment = [category, comment, context].filter(Boolean).join(' • ');
        await handleDetailedRating(interaction, targetUser, rating, fullComment, user, guild);
        return;
      }
      return;
    }

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

        if (targetUser.id === user.id) {
          await interaction.reply({ content: '❌ You cannot rate yourself!', ephemeral: true });
          return;
        }

        if (targetUser.bot) {
          await interaction.reply({ content: '❌ You cannot rate bots!', ephemeral: true });
          return;
        }

        // Show interactive rating options
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`🌟 Rate ${targetUser.username}`)
          .setDescription('Choose how you want to rate this player:')
          .setThumbnail(targetUser.displayAvatarURL())
          .addFields(
            { name: '⚡ Quick Rating', value: 'Use the buttons below for fast rating', inline: true },
            { name: '📝 Detailed Rating', value: 'Click "Detailed Rating" for comprehensive feedback', inline: true }
          )
          .setFooter({ text: 'Your rating helps build the community reputation system' });

        const buttons = createQuickRatingButtons(targetUser.id);

        await interaction.reply({ 
          embeds: [embed], 
          components: [buttons], 
          ephemeral: true 
        });
        break;
      }

      case 'quickrate': {
        const targetUser = options.getUser('user', true);
        const rating = options.getInteger('rating', true);
        const comment = options.getString('comment') || undefined;

        if (targetUser.id === user.id) {
          await interaction.reply({ content: '❌ You cannot rate yourself!', ephemeral: true });
          return;
        }

        if (targetUser.bot) {
          await interaction.reply({ content: '❌ You cannot rate bots!', ephemeral: true });
          return;
        }

        await handleQuickRating(interaction, targetUser, rating, user, guild, comment);
        break;
      }



      case 'rating': {
        const targetUser = options.getUser('user') || user;

        try {
          const dbUser = await storage.getUserByDiscordId(targetUser.id);
          if (!dbUser) {
            await interaction.reply({ 
              content: `❌ ${targetUser.username} hasn't been rated yet!`, 
              ephemeral: true 
            });
            return;
          }
        } catch (error) {
          logger.error(`Database error in rating command for user ${targetUser.id}: ${error}`);
          await interaction.reply({ 
            content: '❌ Database error occurred. Please try again later.', 
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

        // Create enhanced visual progress bars
        const ratingProgress = createProgressBar(avgRating, 3, 15);
        const experienceProgress = createProgressBar(userWithRatings.totalRatings, 50, 12);

        // Determine embed color based on rating
        const embedColor = avgRating >= 2.5 ? 0x57F287 : // Green for excellent
                          avgRating >= 2.0 ? 0x5865F2 : // Blue for good
                          avgRating >= 1.5 ? 0xFEE75C : // Yellow for average
                          0xED4245; // Red for poor

        const recentRatings = userWithRatings.ratingsReceived.slice(0, 3);
        const recentRatingsText = recentRatings.length > 0 
          ? recentRatings.map(r => `${getStarDisplay(r.rating)} from **${r.raterUser?.username || 'Anonymous'}**`).join('\n')
          : 'No recent ratings';

        const embed = new EmbedBuilder()
          .setColor(embedColor)
          .setTitle(`${badge} ${targetUser.username}'s Reputation Profile`)
          .setDescription(`**${title}**\n${ratingProgress}\n**${avgRating.toFixed(2)}/3.0** average`)
          .setThumbnail(targetUser.displayAvatarURL())
          .addFields(
            { 
              name: '⭐ Overall Rating', 
              value: `${starDisplay}\n${ratingProgress}\n**${avgRating.toFixed(2)}/3.0** average`, 
              inline: true 
            },
            { 
              name: '📊 Experience Level', 
              value: `${experienceProgress}\n**${userWithRatings.totalRatings}** total ratings`, 
              inline: true 
            },
            { 
              name: '🌐 Server Activity', 
              value: `Active in **${userWithRatings.ratingsReceived.length > 0 ? 
                Array.from(new Set(userWithRatings.ratingsReceived.map(r => r.server.name))).length : 0}** servers`, 
              inline: true 
            },
            { 
              name: '🕒 Recent Ratings', 
              value: recentRatingsText, 
              inline: false 
            }
          )
          .setFooter({ text: `Reputation System • ${new Date().toLocaleDateString()}` })
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
    logger.error(`Error handling Discord interaction: ${error}`);

    // Only try to respond if the interaction is still valid and hasn't been responded to
    try {
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: '❌ An error occurred while processing your command. Please try again later.', 
          ephemeral: true 
        });
      }
    } catch (replyError) {
      logger.error(`Failed to send error response to interaction: ${replyError}`);
    }
  }
});

client.on('guildCreate', async guild => {
  logger.info(`Bot added to new server: ${guild.name} (${guild.id})`);
  await ensureServerExists(guild);
});

client.on('guildDelete', guild => {
  logger.info(`Bot removed from server: ${guild.name} (${guild.id})`);
});

// Function to get bot statistics
export function getBotStats() {
  return {
    guildCount: client.guilds.cache.size,
    userCount: client.users.cache.size,
    uptime: client.uptime,
    readyAt: client.readyAt,
    status: client.isReady() ? 'online' : 'offline'
  };
}

export async function startBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    logger.fatal('DISCORD_BOT_TOKEN environment variable is required');
    throw new Error('DISCORD_BOT_TOKEN environment variable is required');
  }

  await client.login(token);
}