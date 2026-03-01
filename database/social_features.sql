
-- Social Star/Follow table
CREATE TABLE IF NOT EXISTS stars (
    star_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_id INT NOT NULL, -- user_id or course_id
    target_type VARCHAR(20) NOT NULL, -- 'user' or 'course'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, target_id, target_type)
);

-- Trigger 1 Component A: Notify followers of uploader
CREATE OR REPLACE FUNCTION notify_followers_of_upload()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Notify users who star the uploader
    INSERT INTO notification (recipient_user_id, actor_user_id, note_id, action_type)
    SELECT s.user_id, NEW.uploader_id, NEW.note_id, 'follow_upload'
    FROM stars s
    WHERE s.target_id = NEW.uploader_id AND s.target_type = 'user'
    AND s.user_id != NEW.uploader_id; -- Don't notify self

    -- 2. Notify users who star the course
    INSERT INTO notification (recipient_user_id, actor_user_id, note_id, action_type)
    SELECT s.user_id, NEW.uploader_id, NEW.note_id, 'course_upload'
    FROM stars s
    WHERE s.target_id = NEW.course_id AND s.target_type = 'course'
    AND s.user_id != NEW.uploader_id
    AND NOT EXISTS (
        SELECT 1 FROM notification n 
        WHERE n.recipient_user_id = s.user_id 
        AND n.note_id = NEW.note_id 
        AND n.action_type = 'follow_upload'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_followers_upload ON note;
CREATE TRIGGER trg_notify_followers_upload
AFTER INSERT ON note
FOR EACH ROW
EXECUTE FUNCTION notify_followers_of_upload();

-- Trigger 2: Notify followers of milestones
CREATE OR REPLACE FUNCTION notify_followers_of_milestone()
RETURNS TRIGGER AS $$
DECLARE
    _badge_name VARCHAR;
BEGIN
    SELECT name INTO _badge_name FROM badge WHERE badge_id = NEW.badge_id;

    INSERT INTO notification (recipient_user_id, actor_user_id, action_type)
    SELECT s.user_id, NEW.user_id, 'follower_milestone:' || _badge_name
    FROM stars s
    WHERE s.target_id = NEW.user_id AND s.target_type = 'user'
    AND s.user_id != NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_followers_milestone ON user_badge;
CREATE TRIGGER trg_notify_followers_milestone
AFTER INSERT ON user_badge
FOR EACH ROW
EXECUTE FUNCTION notify_followers_of_milestone();

-- Trigger 3: Notify user when they get a new follower
CREATE OR REPLACE FUNCTION notify_user_of_new_follower()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.target_type = 'user' THEN
        INSERT INTO notification (recipient_user_id, actor_user_id, action_type)
        VALUES (NEW.target_id, NEW.user_id, 'new_follower');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_new_follower ON stars;
CREATE TRIGGER trg_notify_new_follower
AFTER INSERT ON stars
FOR EACH ROW
EXECUTE FUNCTION notify_user_of_new_follower();
