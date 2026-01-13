-- Migration: Add gif_url field to Figures table
-- Purpose: Cache JugglingLab GIF URLs to avoid repeated API calls
-- Date: 2026-01-13
-- Author: Claude Code

-- Add gif_url column after video_url
ALTER TABLE `Figures`
ADD COLUMN `gif_url` VARCHAR(255) NULL
COMMENT 'URL du GIF JugglingLab généré et caché localement (ex: /gifs/123-531.gif)'
AFTER `video_url`;

-- Add index for efficient querying of figures with cached GIFs
CREATE INDEX `idx_gif_url` ON `Figures` (`gif_url`);

-- Rollback instructions:
-- To rollback this migration, run:
-- ALTER TABLE `Figures` DROP COLUMN `gif_url`;
-- DROP INDEX `idx_gif_url` ON `Figures`;
