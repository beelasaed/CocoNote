
-- INCREMENT DOWNLOADS

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


-- INCREMENT UPVOTES

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


DROP TRIGGER IF EXISTS trg_increment_upvote ON upvote;
CREATE TRIGGER trg_increment_upvote
AFTER INSERT OR DELETE ON upvote
FOR EACH ROW
EXECUTE FUNCTION adjust_note_upvotes();



-- 3. ASSIGN BADGES

CREATE OR REPLACE FUNCTION assign_upload_badges()
RETURNS TRIGGER AS $$
DECLARE
    total_uploads INT;
    badge_id INT;
BEGIN
    SELECT COUNT(*) INTO total_uploads FROM note WHERE uploader_id = NEW.uploader_id;

  
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

DROP TRIGGER IF EXISTS trg_assign_upload_badge ON note;
CREATE TRIGGER trg_assign_upload_badge
AFTER INSERT ON note
FOR EACH ROW
EXECUTE FUNCTION assign_upload_badges();