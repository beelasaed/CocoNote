
-- Trigger: Update downloads count in note table after insert into download--
CREATE OR REPLACE FUNCTION increment_note_downloads()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE note SET downloads = downloads + 1 WHERE note_id = NEW.note_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_download
AFTER INSERT ON download
FOR EACH ROW
EXECUTE FUNCTION increment_note_downloads();

-- Trigger: Update upvotes count in note table after insert into upvote--
CREATE OR REPLACE FUNCTION increment_note_upvotes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE note SET upvotes = upvotes + 1 WHERE note_id = NEW.note_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_upvote
AFTER INSERT ON upvote
FOR EACH ROW
EXECUTE FUNCTION increment_note_upvotes();

-- Trigger: Assign badge based on total uploads--
CREATE OR REPLACE FUNCTION assign_upload_badges()
RETURNS TRIGGER AS $$
DECLARE
    total_uploads INT;
    badge_id INT;
BEGIN
    SELECT COUNT(*) INTO total_uploads FROM note WHERE uploader_id = NEW.uploader_id;

    -- Example: badge_id 1 for 10 uploads, 2 for 20 uploads, adjust as needed--
    IF total_uploads >= 10 THEN
        badge_id := 1;
        INSERT INTO user_badge(user_id, badge_id)
        VALUES (NEW.uploader_id, badge_id)
        ON CONFLICT DO NOTHING;
    END IF;

    IF total_uploads >= 20 THEN
        badge_id := 2;
        INSERT INTO user_badge(user_id, badge_id)
        VALUES (NEW.uploader_id, badge_id)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assign_upload_badge
AFTER INSERT ON note
FOR EACH ROW
EXECUTE FUNCTION assign_upload_badges();
