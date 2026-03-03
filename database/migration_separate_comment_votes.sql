-- Migration: Separate Comment Upvote and Downvote Counts

-- 1. Add columns to comment table
ALTER TABLE comment ADD COLUMN IF NOT EXISTS upvotes INT DEFAULT 0;
ALTER TABLE comment ADD COLUMN IF NOT EXISTS downvotes INT DEFAULT 0;

-- 2. Backfill existing counts from comment_vote
UPDATE comment c
SET 
    upvotes = (SELECT COUNT(*) FROM comment_vote WHERE comment_id = c.comment_id AND vote_type = 1),
    downvotes = (SELECT COUNT(*) FROM comment_vote WHERE comment_id = c.comment_id AND vote_type = -1);

-- 3. Note: The triggers will handle future updates.
