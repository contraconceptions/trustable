# Trustable Bot - Discord Reputation System

## Overview

Trustable Bot is a comprehensive Discord reputation system that creates a cross-server trust network for gaming communities. Users can rate each other with a 1-3 star system, with ratings following them across all Discord servers that have the bot installed. The system includes visual badges, titles, interactive rating components, and real-time dashboard monitoring.

## Key Features

### 🌟 Interactive Rating System
- **Button-Based Quick Ratings**: Instant ⭐, ⭐⭐, or ⭐⭐⭐ ratings with single clicks
- **Detailed Modal Forms**: Comprehensive rating forms with categories, comments, and context
- **Smart Rate Limiting**: Prevents spam with 24-hour cooldowns between rating the same user
- **Real-time Feedback**: Immediate visual confirmation of rating submissions

### 🏆 Cross-Server Reputation Network
- **Global User Profiles**: Ratings follow users across all servers with the bot installed
- **Reputation Passport**: Players can't escape their reputation by switching servers
- **Server-Specific Analytics**: Track community health within individual Discord servers
- **Multi-Server Activity Tracking**: See which servers users are active in

### 🎮 Advanced Discord Integration
- **Slash Commands**: Modern Discord command system with autocomplete and validation
- **Context Menu Actions**: Right-click users for quick rating checks
- **Rich Embeds**: Professional, color-coded displays with progress bars and badges
- **Mobile Compatibility**: Fully functional across all Discord clients

### 📊 Comprehensive Analytics
- **Personal Statistics** (`/mystats`): Individual rating breakdowns and achievement tracking
- **Server Analytics** (`/serverstats`): Community-wide statistics and rating distribution  
- **Global Leaderboards** (`/leaderboard`): Top-rated users with medals and rankings
- **Rating Profiles** (`/rating`): Detailed user reputation with cross-server activity

### 🖥️ Web Dashboard
- **Real-Time Monitoring**: Live statistics updating every 30 seconds
- **Discord Authentication**: Secure OAuth login for personalized data access
- **Public Overview**: Transparent community statistics accessible to everyone
- **Personal Analytics**: Private detailed statistics for authenticated users

## Available Commands

### Rating Commands
- `/rate [user]` - Interactive rating with buttons and detailed forms
- `/quickrate [user] [stars] [comment]` - Fast rating with preset options
- `/rating [user]` - Check detailed user reputation and history

### Analytics Commands
- `/mystats` - View personal rating statistics and progress
- `/serverstats` - Server-specific rating analytics and distribution
- `/leaderboard` - Top-rated users across all servers with rankings
- `/profile [user]` - Comprehensive user profile with rating history

### Administrative Commands
- `/moderate remove [user]` - Moderation tools for server administrators

## Visual Enhancement System

### 🏅 Dynamic Badges & Titles
- **Champion** (🏆): Users with 2.8+ average rating
- **Gold Star Player** (🥇): Users with 2.5+ average rating
- **Silver Player** (🥈): Users with 2.0+ average rating
- **Bronze Player** (🥉): Users with 1.5+ average rating
- **New Player** (🆕): Users with fewer than 5 ratings

### 🎨 Visual Elements
- **Progress Bars**: Visual representation of rating levels and experience
- **Dynamic Colors**: Embed colors change based on rating quality (green for excellent, red for poor)
- **Star Displays**: Intuitive 1-3 star rating visualization
- **Medal Rankings**: Gold, silver, bronze medals for leaderboard positions

## Technical Specifications

### Database & Storage
- **PostgreSQL**: Reliable, scalable database with proper relationships
- **Type-Safe Operations**: Drizzle ORM with TypeScript for data integrity
- **Session Management**: Secure user authentication with PostgreSQL storage
- **Rate Limiting**: Database-level spam prevention and abuse protection

### Security & Privacy
- **Discord OAuth**: Secure authentication using Discord's official API
- **Private Data Protection**: Personal statistics only visible to account owners
- **Admin Controls**: Server administrators can moderate inappropriate ratings
- **Cross-Server Isolation**: Server-specific data remains separate when needed

### Performance & Reliability
- **Real-Time Updates**: Instant rating updates across all interfaces
- **Auto-Reconnection**: Robust Discord API connection management
- **Caching**: Efficient data retrieval with smart cache invalidation
- **Error Handling**: Graceful handling of Discord API limitations

## Benefits for Communities

### For Server Administrators
- **Community Health Monitoring**: Track positive/negative interaction trends
- **Trust Building**: Help members identify reliable players quickly
- **Moderation Tools**: Remove inappropriate ratings and manage user behavior
- **Growth Analytics**: Understand community engagement patterns

### For Community Members
- **Reputation Building**: Build trust and recognition across multiple servers
- **Quick Player Assessment**: Instantly see if someone is trustworthy
- **Personal Progress Tracking**: Monitor your own reputation development
- **Achievement System**: Earn badges and titles for positive behavior

### For Gaming Communities
- **Cross-Server Networking**: Connect trustworthy players across communities
- **Quality Assurance**: Filter out problematic players automatically
- **Community Standards**: Encourage positive behavior through visibility
- **Network Effects**: Larger network creates more value for all participants

## Use Cases

### Gaming Communities
- **LFG (Looking for Group)**: Quickly identify reliable teammates
- **Trading**: Build trust for in-game item exchanges
- **Competitive Play**: Find skilled and cooperative players
- **Community Events**: Organize activities with trusted participants

### Professional Discord Servers
- **Freelancer Networks**: Build professional reputation across projects
- **Study Groups**: Identify helpful and knowledgeable members
- **Business Communities**: Establish credibility and trust
- **Mentorship Programs**: Connect experienced members with newcomers

## Getting Started

1. **Invite the Bot**: Add Trustable Bot to your Discord server
2. **Start Rating**: Use `/rate @username` to begin building community trust
3. **Monitor Progress**: Check `/serverstats` to see community health
4. **Access Dashboard**: Visit the web dashboard for detailed analytics
5. **Build Network**: Connect with other servers to expand the trust network

## Why Choose Trustable Bot?

- **Proven Technology**: Built with Discord.js v14 and modern web technologies
- **Cross-Server Innovation**: Unique reputation system that follows users everywhere
- **Professional Design**: Polished interface with attention to user experience
- **Active Development**: Regular updates and feature improvements
- **Community Focused**: Designed by gamers, for gamers and online communities

Transform your Discord community with a comprehensive reputation system that builds trust, encourages positive behavior, and connects reliable members across the entire Discord ecosystem.