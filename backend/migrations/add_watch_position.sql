-- Add new columns for watch progress tracking
ALTER TABLE watch_history ADD COLUMN IF NOT EXISTS watch_position FLOAT DEFAULT 0;
ALTER TABLE watch_history ADD COLUMN IF NOT EXISTS progress_percent FLOAT DEFAULT 0;
