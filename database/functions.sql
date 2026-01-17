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