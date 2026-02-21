
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

CREATE OR REPLACE FUNCTION upload_new_note(
    _title VARCHAR,
    _desc TEXT,
    _batch VARCHAR,
    _dept_id INT,
    _course_id INT,
    _cat_id INT,
    _uploader_id INT,
    _file_path VARCHAR,
    _file_hash VARCHAR
)
RETURNS TABLE (
    note_id INT,
    title VARCHAR,
    is_flagged BOOLEAN,
    created_at TIMESTAMP
)
LANGUAGE plpgsql AS $$
DECLARE
    new_note_id INT;
BEGIN
    -- Insert the main note
    INSERT INTO note (title, description, batch, department_id, course_id, category_id, uploader_id, file_path, file_hash)
    VALUES (_title, _desc, _batch, _dept_id, _course_id, _cat_id, _uploader_id, _file_path, _file_hash)
    RETURNING note.note_id INTO new_note_id;

    -- Create the version entry
    INSERT INTO note_version (note_id, version_number, file_path, changes_description)
    VALUES (new_note_id, 1, _file_path, 'Initial upload');

    -- Return the result
    RETURN QUERY
    SELECT n.note_id, n.title, n.is_flagged, n.created_at
    FROM note n
    WHERE n.note_id = new_note_id;
END;
$$;

-- toggle_upvote

CREATE OR REPLACE FUNCTION toggle_upvote(p_user_id INT, p_note_id INT)
RETURNS TEXT 
LANGUAGE plpgsql
AS $$
BEGIN
   
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

CREATE OR REPLACE FUNCTION track_download(p_user_id INT, p_note_id INT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO download (user_id, note_id) VALUES (p_user_id, p_note_id);
    RETURN 'TRACKED';
END;
$$;