=/* FILE: triggers.sql
   PURPOSE: Automates data integrity (timestamps) and Gamification (Badges, Counts).
*/

-- 1. AUTOMATIC TIMESTAMP UPDATE (New Addition)
-- Purpose: Automatically updates 'updated_at' column when a note is edited.
CREATE OR REPLACE FUNCTION refresh_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_note_updated ON note;
CREATE TRIGGER trigger_note_updated
BEFORE UPDATE ON note
FOR EACH ROW
EXECUTE PROCEDURE refresh_updated_at_column();


-- 2. INCREMENT DOWNLOADS (Your Code)
-- Purpose: Updates 'note.downloads' when a record is added to 'download' table.
CREATE OR REPLACE FUNCTION increment_note_downloads()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE note SET downloads = downloads + 1 WHERE note_id = NEW.note_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- (Conditional drop to prevent errors if you re-run)
DROP TRIGGER IF EXISTS trg_increment_download ON download;
CREATE TRIGGER trg_increment_download
AFTER INSERT ON download
FOR EACH ROW
EXECUTE FUNCTION increment_note_downloads();


-- 3. INCREMENT UPVOTES (Your Code)
-- Purpose: Updates 'note.upvotes' when a record is added to 'upvote' table.
CREATE OR REPLACE FUNCTION increment_note_upvotes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE note SET upvotes = upvotes + 1 WHERE note_id = NEW.note_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_upvote ON upvote;
CREATE TRIGGER trg_increment_upvote
AFTER INSERT ON upvote
FOR EACH ROW
EXECUTE FUNCTION increment_note_upvotes();


-- 4. ASSIGN BADGES (Your Code)
-- Purpose: Awards badges automatically when upload milestones are met.
CREATE OR REPLACE FUNCTION assign_upload_badges()
RETURNS TRIGGER AS $$
DECLARE
    total_uploads INT;
    badge_id INT;
BEGIN
    SELECT COUNT(*) INTO total_uploads FROM note WHERE uploader_id = NEW.uploader_id;

    -- Milestone: 10 Uploads
    IF total_uploads >= 10 THEN
        badge_id := 1;
        INSERT INTO user_badge(user_id, badge_id)
        VALUES (NEW.uploader_id, badge_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Milestone: 20 Uploads
    IF total_uploads >= 20 THEN
        badge_id := 2;
        INSERT INTO user_badge(user_id, badge_id)
        VALUES (NEW.uploader_id, badge_id)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_upload_badge ON note;
CREATE TRIGGER trg_assign_upload_badge
AFTER INSERT ON note
FOR EACH ROW
EXECUTE FUNCTION assign_upload_badges();