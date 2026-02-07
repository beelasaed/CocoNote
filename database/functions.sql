-- 1. SEARCH NOTES (Advanced filtering)
CREATE OR REPLACE FUNCTION search_notes(
    _search_text VARCHAR DEFAULT NULL,
    _batch VARCHAR DEFAULT NULL,
    _dept_id INT DEFAULT NULL,
    _course_id INT DEFAULT NULL
)
RETURNS TABLE (
    note_id INT,
    title VARCHAR,
    description TEXT,
    file_path VARCHAR,
    uploader_name VARCHAR,
    course_code VARCHAR,
    created_at TIMESTAMP,
    upvotes INT,
    downloads INT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.note_id, 
        n.title, 
        n.description,
        n.file_path,
        u.name, 
        c.code, 
        n.created_at,
        n.upvotes,
        n.downloads
    FROM note n
    JOIN users u ON n.uploader_id = u.user_id
    JOIN course c ON n.course_id = c.course_id
    WHERE 
        (_search_text IS NULL OR 
         n.title ILIKE '%' || _search_text || '%' OR 
         n.description ILIKE '%' || _search_text || '%')
        AND (_batch IS NULL OR n.batch = _batch)
        AND (_dept_id IS NULL OR n.department_id = _dept_id)
        AND (_course_id IS NULL OR n.course_id = _course_id)
    ORDER BY n.created_at DESC;
END;
$$;

-- 2. GET PERSONALIZED FEED
CREATE OR REPLACE FUNCTION get_personalized_feed(current_user_id INT)
RETURNS TABLE (
    note_id INT,
    title VARCHAR,
    description TEXT,
    file_path VARCHAR,
    created_at TIMESTAMP,
    batch VARCHAR,
    upvotes INT,
    downloads INT,
    uploader VARCHAR,
    course VARCHAR,
    department VARCHAR,
    category VARCHAR,
    is_upvoted BOOLEAN 
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.note_id,
        v.title, 
        v.description, 
        v.file_path, 
        v.created_at, 
        v.batch,
        v.upvotes, 
        v.downloads, 
        v.uploader, 
        v.course, 
        v.department, 
        v.category,
        EXISTS(
            SELECT 1 FROM upvote u 
            WHERE u.note_id = v.note_id AND u.user_id = current_user_id
        ) AS is_upvoted
    FROM view_feed_details v
    ORDER BY v.created_at DESC;
END;
$$;
-- 2. department filtering
CREATE OR REPLACE FUNCTION get_filtered_feed(current_user_id INT, _dept_name VARCHAR DEFAULT NULL)
RETURNS TABLE (
    note_id INT,
    title VARCHAR,
    description TEXT,
    file_path VARCHAR,
    created_at TIMESTAMP,
    batch VARCHAR,
    upvotes INT,
    downloads INT,
    uploader VARCHAR,
    course VARCHAR,
    department VARCHAR,
    category VARCHAR,
    is_upvoted BOOLEAN,
    is_saved BOOLEAN
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.note_id,
        v.title, 
        v.description, 
        v.file_path, 
        v.created_at, 
        v.batch,
        v.upvotes, 
        v.downloads, 
        v.uploader, 
        v.course, 
        v.department, 
        v.category,
        EXISTS(
            SELECT 1 FROM upvote u 
            WHERE u.note_id = v.note_id AND u.user_id = current_user_id
        ) AS is_upvoted,
        EXISTS(
            SELECT 1 FROM saved_note sn 
            WHERE sn.note_id = v.note_id AND sn.user_id = current_user_id
        ) AS is_saved
    FROM view_feed_details v
    WHERE (_dept_name IS NULL OR v.department = _dept_name)
    ORDER BY v.created_at DESC;
END;
$$;