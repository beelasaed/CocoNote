-- Function to get recommendations for a specific user
CREATE OR REPLACE FUNCTION get_user_recommendations(target_user_id INT, limit_count INT DEFAULT 10)
RETURNS TABLE (
    note_id INT,
    title VARCHAR,
    description TEXT,
    file_path VARCHAR,
    created_at TIMESTAMP,
    course_code VARCHAR,
    batch VARCHAR,
    uploader VARCHAR,
    upvotes INT,
    downloads INT,
    relevance_score INT
) AS $$
#variable_conflict use_column
DECLARE
    user_dept_id INT;
    user_batch INT;
BEGIN
    -- Get user's department and batch
    SELECT u.department_id, u.batch INTO user_dept_id, user_batch
    FROM users u WHERE u.user_id = target_user_id;

    RETURN QUERY
    SELECT 
        n.note_id,
        n.title,
        n.description,
        n.file_path,
        n.created_at,
        c.code AS course_code,
        n.batch,
        u.name AS uploader,
        n.upvotes,
        n.downloads,
        (
            CASE 
                WHEN n.department_id = user_dept_id AND n.batch = CAST(user_batch AS VARCHAR) THEN 100
                WHEN n.department_id = user_dept_id THEN 50
                ELSE 10
            END 
            + (n.upvotes * 2) 
            + n.downloads
        ) AS relevance_score
    FROM note n
    LEFT JOIN course c ON n.course_id = c.course_id
    LEFT JOIN users u ON n.uploader_id = u.user_id
    WHERE n.uploader_id != target_user_id -- Exclude own notes
    AND n.note_id NOT IN ( -- Exclude already downloaded/upvoted notes (optional, but good for discovery)
        SELECT d.note_id FROM download d WHERE d.user_id = target_user_id
    )
    ORDER BY relevance_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get related notes (Item-Item Collaborative Filtering Lite)
-- "Students who downloaded this also downloaded..."
CREATE OR REPLACE FUNCTION get_related_notes(target_note_id INT, limit_count INT DEFAULT 5)
RETURNS TABLE (
    note_id INT,
    title VARCHAR,
    description TEXT,
    file_path VARCHAR,
    created_at TIMESTAMP,
    course_code VARCHAR,
    batch VARCHAR,
    uploader VARCHAR,
    upvotes INT,
    downloads INT,
    common_downloads BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    WITH target_downloaders AS (
        -- Get all users who downloaded the target note
        SELECT d.user_id FROM download d WHERE d.note_id = target_note_id
    ),
    related_notes_counts AS (
        -- Find other notes downloaded by these users
        SELECT 
            d.note_id,
            COUNT(d.user_id) as common_download_count
        FROM download d
        WHERE d.user_id IN (SELECT t.user_id FROM target_downloaders t)
        AND d.note_id != target_note_id
        GROUP BY d.note_id
    )
    SELECT 
        n.note_id,
        n.title,
        n.description,
        n.file_path,
        n.created_at,
        c.code AS course_code,
        n.batch,
        u.name AS uploader,
        n.upvotes,
        n.downloads,
        r.common_download_count 
    FROM related_notes_counts r
    JOIN note n ON r.note_id = n.note_id
    LEFT JOIN course c ON n.course_id = c.course_id
    LEFT JOIN users u ON n.uploader_id = u.user_id
    ORDER BY r.common_download_count DESC, n.upvotes DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
