-- ==========================================
-- 1. TRIGGER: UPDATE POINTS & ASSIGN BADGES
-- ==========================================

CREATE OR REPLACE FUNCTION update_user_stats_and_badges()
RETURNS TRIGGER AS $$
DECLARE
    _user_id INT;
    _total_uploads INT;
    _total_upvotes INT;
    _total_downloads INT;
    _current_points INT;
    _points_change INT := 0;
BEGIN
    -- Determine User ID and Points Change based on operation
    IF TG_TABLE_NAME = 'note' THEN
        IF TG_OP = 'INSERT' THEN
            _user_id := NEW.uploader_id;
            _points_change := 10; -- Upload a note: +10 points
        ELSIF TG_OP = 'DELETE' THEN
            _user_id := OLD.uploader_id;
            _points_change := -10;
        END IF;
    
    ELSIF TG_TABLE_NAME = 'upvote' THEN
        IF TG_OP = 'INSERT' THEN
            SELECT uploader_id INTO _user_id FROM note WHERE note_id = NEW.note_id;
            _points_change := 5; -- Receive upvote: +5 points

            -- Create notification for uploader
            INSERT INTO notification (recipient_user_id, actor_user_id, note_id, action_type)
            VALUES (_user_id, NEW.user_id, NEW.note_id, 'upvote');
        ELSIF TG_OP = 'DELETE' THEN
            SELECT uploader_id INTO _user_id FROM note WHERE note_id = OLD.note_id;
            _points_change := -5;
        END IF;

    ELSIF TG_TABLE_NAME = 'download' THEN
        IF TG_OP = 'INSERT' THEN
            SELECT uploader_id INTO _user_id FROM note WHERE note_id = NEW.note_id;
            _points_change := 10; -- Note downloaded: +10 points

            -- Create notification for uploader
            INSERT INTO notification (recipient_user_id, actor_user_id, note_id, action_type)
            VALUES (_user_id, NEW.user_id, NEW.note_id, 'download');
        -- No deduction for deleting download history usually, but let's keep it additive mostly
        END IF;
    
    ELSIF TG_TABLE_NAME = 'note_rating' THEN
        IF TG_OP = 'INSERT' THEN
            SELECT uploader_id INTO _user_id FROM note WHERE note_id = NEW.note_id;
            _points_change := 5; -- Receive rating: +5 points
            
            -- Create notification for uploader
            INSERT INTO notification (recipient_user_id, actor_user_id, note_id, action_type)
            VALUES (_user_id, NEW.user_id, NEW.note_id, 'rating');
        ELSIF TG_OP = 'DELETE' THEN
            SELECT uploader_id INTO _user_id FROM note WHERE note_id = OLD.note_id;
            _points_change := -5;
        END IF;
    END IF;

    -- If no user identified (e.g., self-action might be excluded in app logic, but here we just check for null), exit
    IF _user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Update Total Points
    IF _points_change <> 0 THEN
        UPDATE users 
        SET total_points = total_points + _points_change 
        WHERE user_id = _user_id;
    END IF;

    -- Recalculate Stats for Badge Checking
    SELECT total_points INTO _current_points FROM users WHERE user_id = _user_id;
    
    SELECT COUNT(*) INTO _total_uploads FROM note WHERE uploader_id = _user_id;
    
    SELECT COALESCE(SUM(upvotes), 0), COALESCE(SUM(downloads), 0) 
    INTO _total_upvotes, _total_downloads 
    FROM note WHERE uploader_id = _user_id;

    -- Check and Assign Badges

    -- 1. Getting Started (1+ upload)
    IF _total_uploads >= 1 THEN
        PERFORM assign_badge_if_not_exists(_user_id, 'Getting Started');
    END IF;

    -- 2. Prolific Creator (10+ uploads)
    IF _total_uploads >= 10 THEN
        PERFORM assign_badge_if_not_exists(_user_id, 'Prolific Creator');
    END IF;

    -- 3. Popular Author (50+ upvotes)
    IF _total_upvotes >= 50 THEN
        PERFORM assign_badge_if_not_exists(_user_id, 'Popular Author');
    END IF;

    -- 4. Viral Creator (200+ downloads)
    IF _total_downloads >= 200 THEN
        PERFORM assign_badge_if_not_exists(_user_id, 'Viral Creator');
    END IF;

    -- 5. Coconut Expert (1000+ points)
    IF _current_points >= 1000 THEN
         PERFORM assign_badge_if_not_exists(_user_id, 'Coconut Expert');
    END IF;

    -- 6. CocoNote Legend (10+ uploads, 50+ upvotes, 3000+ points)
    IF _total_uploads >= 10 AND _total_upvotes >= 50 AND _current_points >= 3000 THEN
         PERFORM assign_badge_if_not_exists(_user_id, 'CocoNote Legend');
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Helper Function to Assign Badge & Notify
CREATE OR REPLACE FUNCTION assign_badge_if_not_exists(_user_id INT, _badge_name VARCHAR)
RETURNS VOID AS $$
DECLARE
    _badge_id INT;
BEGIN
    SELECT badge_id INTO _badge_id FROM badge WHERE name = _badge_name;
    
    IF _badge_id IS NOT NULL THEN
        -- Try Insert
        INSERT INTO user_badge(user_id, badge_id)
        VALUES (_user_id, _badge_id)
        ON CONFLICT (user_id, badge_id) DO NOTHING;
        
        -- If inserted (checked by found), create notification? 
        -- Actually ON CONFLICT DO NOTHING returns nothing. 
        -- Let's check existence first to trigger notification only on new assignment
        IF FOUND THEN
             -- Insert Notification
             INSERT INTO notification(recipient_user_id, actor_user_id, action_type, is_read)
             VALUES (_user_id, _user_id, 'badge_earned:' || _badge_name, FALSE);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- Helper: Better Notification Logic needs 'FOUND' from Insert, but 'ON CONFLICT' suppresses it.
-- Let's Refine Helper
CREATE OR REPLACE FUNCTION assign_badge_if_not_exists(_user_id INT, _badge_name VARCHAR)
RETURNS VOID AS $$
DECLARE
    _badge_id INT;
    _exists BOOLEAN;
BEGIN
    SELECT badge_id INTO _badge_id FROM badge WHERE name = _badge_name;
    
    IF _badge_id IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM user_badge WHERE user_id = _user_id AND badge_id = _badge_id) INTO _exists;
        
        IF NOT _exists THEN
            INSERT INTO user_badge(user_id, badge_id) VALUES (_user_id, _badge_id);
            
            -- Send Notification
            -- We don't have a specific actor for system events, so we can use the user themselves or specific system ID.
            -- Using user_id as actor for self-achievements seems fine or NULL if schema allows.
            -- Schema: actor_user_id is NOT NULL. So use user_id.
            INSERT INTO notification(recipient_user_id, actor_user_id, action_type, is_read)
            VALUES (_user_id, _user_id, 'badge_earned', FALSE);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- Apply Triggers
DROP TRIGGER IF EXISTS trg_update_stats_note ON note;
CREATE TRIGGER trg_update_stats_note
AFTER INSERT OR DELETE ON note
FOR EACH ROW EXECUTE FUNCTION update_user_stats_and_badges();

DROP TRIGGER IF EXISTS trg_update_stats_upvote ON upvote;
CREATE TRIGGER trg_update_stats_upvote
AFTER INSERT OR DELETE ON upvote
FOR EACH ROW EXECUTE FUNCTION update_user_stats_and_badges();

DROP TRIGGER IF EXISTS trg_update_stats_download ON download;
CREATE TRIGGER trg_update_stats_download
AFTER INSERT ON download
FOR EACH ROW EXECUTE FUNCTION update_user_stats_and_badges();


-- Keep Maintenance Triggers (Sync Note Counts)
-- These were in the original file (increment_note_downloads, adjust_note_upvotes).
-- We should keep them as they update the `note` table columns which we query above.

CREATE OR REPLACE FUNCTION increment_note_downloads()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE note SET downloads = downloads + 1 WHERE note_id = NEW.note_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_download ON download;
CREATE TRIGGER trg_increment_download
BEFORE INSERT ON download  
FOR EACH ROW
EXECUTE FUNCTION increment_note_downloads();
-- Changed to BEFORE or AFTER? 
-- Original was AFTER. stick to AFTER but ensure order doesn't conflict. 
-- Actually, update_user_stats_and_badges reads from `note`. 
-- If we use AFTER for both, order is alphabetical by trigger name.
-- Let's keep `increment_note_downloads` separate.

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
-- Apply trigger to note_rating table
DROP TRIGGER IF EXISTS trg_update_stats_rating ON note_rating;
CREATE TRIGGER trg_update_stats_rating
AFTER INSERT OR DELETE ON note_rating
FOR EACH ROW EXECUTE FUNCTION update_user_stats_and_badges();

-- Trigger to notify 'savers' of a new version
CREATE OR REPLACE FUNCTION notify_note_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.file_path != NEW.file_path THEN
        INSERT INTO notification (recipient_user_id, actor_user_id, note_id, action_type)
        SELECT user_id, NEW.uploader_id, NEW.note_id, 'note_update'
        FROM saved_note
        WHERE note_id = NEW.note_id;
    END IF;          
    RETURN NEW;      
END;                 
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. TRIGGER: PLAGIARISM & DUPLICATE DETECTION
-- ==========================================

CREATE OR REPLACE FUNCTION check_plagiarism()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the same uploader uploaded a note with a >70% similar title in the last 24 hours
    IF EXISTS (
        SELECT 1 FROM note
        WHERE uploader_id = NEW.uploader_id
          AND similarity(title, NEW.title) > 0.7
          AND created_at > NOW() - INTERVAL '24 hours'
          AND note_id != NEW.note_id
    ) THEN
        NEW.is_flagged := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_note_update ON note;
CREATE TRIGGER trg_notify_note_update
AFTER UPDATE ON note
FOR EACH ROW
EXECUTE FUNCTION notify_note_update();
DROP TRIGGER IF EXISTS trg_check_plagiarism ON note;
CREATE TRIGGER trg_check_plagiarism
BEFORE INSERT ON note
FOR EACH ROW
EXECUTE FUNCTION check_plagiarism();
