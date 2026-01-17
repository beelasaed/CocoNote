
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

-- 3. Upload New Note (REQUIRED for NoteController)
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