-- migration_restrict_batches.sql
-- Restrict batches to 12-24

ALTER TABLE users ADD CONSTRAINT check_user_batch CHECK (batch >= 12 AND batch <= 24);
ALTER TABLE note ADD CONSTRAINT check_note_batch CHECK (batch::INTEGER >= 12 AND batch::INTEGER <= 24);
