/* FILE: triggers.sql
   PURPOSE: Automates data integrity and Gamification (Badges, Counts).
*/

-- 1. INCREMENT DOWNLOADS
-- Purpose: Updates 'note.downloads' when a record is added to 'download' table.
CREATE OR REPLACE FUNCTION increment_note_downloads()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE note SET downloads = downloads + 1 WHERE note_id = NEW.note_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_download ON download;
CREATE TRIGGER trg_increment_download
AFTER INSERT ON download
FOR EACH ROW
EXECUTE FUNCTION increment_note_downloads();


-- 2. INCREMENT UPVOTES
-- Purpose: Updates 'note.upvotes' when a record is added to 'upvote' table.
-- TRIGGER FUNCTION: adjust upvotes
CREATE OR REPLACE FUNCTION adjust_note_upvotes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE note SET upvotes = upvotes + 1 WHERE note_id = NEW.note_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE note SET upvotes = upvotes - 1 WHERE note_id = OLD.note_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger
DROP TRIGGER IF EXISTS trg_increment_upvote ON upvote;

-- Create new trigger for both INSERT and DELETE
CREATE TRIGGER trg_increment_upvote
AFTER INSERT OR DELETE ON upvote
FOR EACH ROW
EXECUTE FUNCTION adjust_note_upvotes();



-- 3. ASSIGN BADGES
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