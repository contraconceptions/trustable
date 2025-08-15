
-- Add indexes for frequently queried fields

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_users_average_rating ON users(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_users_total_ratings ON users(total_ratings DESC);

-- Ratings table indexes  
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user_id ON ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_user_id ON ratings(rater_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_server_id ON ratings(server_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings(rating);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ratings_user_server ON ratings(rated_user_id, server_id);
CREATE INDEX IF NOT EXISTS idx_ratings_recent_by_server ON ratings(server_id, created_at DESC);

-- Servers table indexes
CREATE INDEX IF NOT EXISTS idx_servers_discord_server_id ON servers(discord_server_id);
CREATE INDEX IF NOT EXISTS idx_servers_is_active ON servers(is_active);
CREATE INDEX IF NOT EXISTS idx_servers_total_ratings ON servers(total_ratings DESC);

-- Rate limits table indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_target ON rate_limits(user_id, target_user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_rated_at ON rate_limits(last_rated_at);
