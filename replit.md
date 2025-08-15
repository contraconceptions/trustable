# Overview

Trustable Bot is a Discord bot application that creates a cross-server reputation system for gaming communities. Users can rate each other with a 1-3 star system, with ratings following them across all Discord servers that have the bot installed. The system includes visual badges and titles that appear in user interactions, comprehensive rating profiles, and real-time dashboard monitoring. Built with modern full-stack architecture using React, Express.js, PostgreSQL, and Discord.js v14 with slash commands and context menus.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## August 15, 2025 - Custom Domain Integration & UI Enhancement
- **Custom Domain**: Updated all app references to use https://trustable.contraconcepts.com/ 
- **Header Redesign**: Replaced background image with modern gradient (Discord blue to purple to indigo)
- **OAuth Configuration**: Updated Discord OAuth redirect URIs for custom domain
- **Link Updates**: Support, documentation, and issue reporting links now point to custom domain
- **Brand Consistency**: All external references now use the professional custom domain

## August 15, 2025 - Discord Authentication & Personal Dashboard Implementation
- **OAuth Integration**: Added Discord authentication for secure user login to web dashboard
- **Personal Analytics**: Users can now view detailed personal statistics through authenticated web interface
- **Tab-Based Dashboard**: Separated public server overview from private personal stats
- **Session Management**: Secure PostgreSQL-based session storage for authenticated users
- **Enhanced Privacy**: Personal data only accessible to authenticated account owners
- **User Interface**: Added login/logout buttons, user avatars, and responsive authentication flow

## August 14, 2025 - Major Bot Enhancement with Advanced Discord Features
- **Interactive Rating System Implementation**: Added button-based quick ratings and modal forms for detailed feedback
- **Advanced Visual Elements**: Implemented progress bars, dynamic embed colors, professional badges, and enhanced leaderboards
- **New Commands Added**: `/mystats`, `/serverstats`, enhanced `/rating` and `/leaderboard` with comprehensive analytics
- **Rich User Profiles**: Cross-server reputation tracking, recent ratings display, and experience level visualization
- **UI/UX Improvements**: Professional embed design with color-coded rating quality, medal rankings, and detailed statistics
- **Database Enhancements**: Added `getRatingsByServer` method for server-specific analytics
- **Code Quality**: Fixed all TypeScript errors, improved error handling, and enhanced interaction management

## August 12, 2025 - Bot Successfully Deployed and Tested
- Discord bot successfully connected and registered all commands
- Bot added to "contra-verse" test server and functioning properly
- Basic visual rating features confirmed working
- Cross-server reputation system operational

# System Architecture

## Frontend Architecture
The client-side is built with React and TypeScript, using Vite as the build tool. The UI is constructed with shadcn/ui components based on Radix UI primitives and styled with Tailwind CSS. The application uses Wouter for client-side routing and TanStack Query for server state management. The frontend follows a component-based architecture with a clear separation between UI components, pages, and business logic.

## Backend Architecture
The server uses Express.js with TypeScript in ESM module format. The application is structured with separate layers for routing, storage operations, and business logic. The bot functionality is implemented using Discord.js v14 with slash command support. Rate limiting is implemented at both the database and application levels to prevent abuse.

## Database Design
The system uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema includes four main entities:
- Users: Stores Discord user information and aggregated rating statistics
- Servers: Tracks Discord server information and activity
- Ratings: Individual rating records with 1-3 star values and optional comments
- Rate Limits: Prevents users from rating the same person multiple times within a timeframe

The database uses UUID primary keys and includes proper foreign key relationships with cascading updates for maintaining data integrity.

## Authentication & Authorization
The application uses Discord OAuth for user authentication through the bot's presence in servers. No separate authentication system is implemented as access is controlled through Discord server membership and bot permissions.

## Real-time Features
The dashboard includes real-time updates through periodic polling using TanStack Query's refetch intervals. Recent ratings refresh every 10 seconds, while general statistics update every 30 seconds to provide live monitoring capabilities.

# External Dependencies

## Core Technologies
- **Neon Database**: Serverless PostgreSQL database hosting with connection pooling
- **Discord.js**: Official Discord API library for bot functionality and slash commands
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect
- **React Query**: Server state management and caching for frontend data fetching

## UI Framework
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Radix UI**: Headless UI components for accessibility and behavior

## Development Tools
- **Vite**: Frontend build tool with hot module replacement
- **TypeScript**: Static type checking across the entire application
- **ESBuild**: Fast bundling for production server builds

## Runtime Environment
The application is designed to run on Node.js with ES modules and expects a DATABASE_URL environment variable for PostgreSQL connection. The bot requires a Discord bot token and appropriate permissions in target servers.