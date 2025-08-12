# Overview

GamerRating Bot is a Discord bot application that allows users to rate each other in gaming communities. The system provides a 1-3 star rating system with optional comments, includes rate limiting to prevent abuse, and features a comprehensive web dashboard for monitoring bot activity and statistics. The application is built with a modern full-stack architecture using React for the frontend, Express.js for the backend, and PostgreSQL for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

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