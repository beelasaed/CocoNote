
-- Top contributors procedure--
CREATE OR REPLACE FUNCTION get_top_contributors(limit_count INT)
RETURNS TABLE(user_name VARCHAR, points INT, uploads INT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.name, u.total_points, COUNT(n.note_id) as uploads
    FROM users u
    LEFT JOIN note n ON n.uploader_id = u.user_id
    GROUP BY u.user_id
    ORDER BY u.total_points DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Most downloaded notes procedure--
CREATE OR REPLACE FUNCTION get_top_downloaded_notes(limit_count INT)
RETURNS TABLE(note_title VARCHAR, downloads INT) AS $$
BEGIN
    RETURN QUERY
    SELECT n.title, n.downloads
    FROM note n
    ORDER BY n.downloads DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 1. UPLOAD NEW NOTE
-- Encapsulates the INSERT logic for security.
CREATE OR REPLACE FUNCTION upload_new_note(
    _title VARCHAR,
    _desc TEXT,
    _batch VARCHAR,
    _dept_id INT,
    _course_id INT,
    _cat_id INT,
    _uploader_id INT,
    _file_path VARCHAR
) 
RETURNS TABLE (
    note_id INT, 
    title VARCHAR, 
    created_at TIMESTAMP
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO note 
    (title, description, batch, department_id, course_id, category_id, uploader_id, file_path) 
    VALUES 
    (_title, _desc, _batch, _dept_id, _course_id, _cat_id, _uploader_id, _file_path)
    RETURNING note.note_id, note.title, note.created_at;
END;
$$;

-- PROCEDURE: toggle_upvote
-- Logic: If record exists -> DELETE (Undo Upvote). If not -> INSERT (Add Upvote).
CREATE OR REPLACE FUNCTION toggle_upvote(p_user_id INT, p_note_id INT)
RETURNS TEXT -- Returning a string so the frontend knows what happened
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the user is trying to upvote their own note
    IF EXISTS (SELECT 1 FROM note WHERE note_id = p_note_id AND uploader_id = p_user_id) THEN
        RAISE EXCEPTION 'You cannot upvote your own note.';
    END IF;

    IF EXISTS (SELECT 1 FROM upvote WHERE user_id = p_user_id AND note_id = p_note_id) THEN
        DELETE FROM upvote WHERE user_id = p_user_id AND note_id = p_note_id;
        RETURN 'REMOVED';
    ELSE
        INSERT INTO upvote (user_id, note_id) VALUES (p_user_id, p_note_id);
        RETURN 'ADDED';
    END IF;
END;
$$;
-- PROCEDURE: Track Download
CREATE OR REPLACE FUNCTION track_download(p_user_id INT, p_note_id INT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO download (user_id, note_id) VALUES (p_user_id, p_note_id);
    RETURN 'TRACKED';
END;
$$;