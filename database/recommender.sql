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
    average_rating NUMERIC,
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
    WITH uploader_interactions AS (
        -- Users the target user has interacted with (downloaded, upvoted, or saved from)
        SELECT n.uploader_id, COUNT(*) as interaction_count
        FROM (
            SELECT note_id FROM download WHERE user_id = target_user_id
            UNION ALL
            SELECT note_id FROM upvote WHERE user_id = target_user_id
            UNION ALL
            SELECT note_id FROM saved_note WHERE user_id = target_user_id
        ) user_actions
        JOIN note n ON user_actions.note_id = n.note_id
        GROUP BY n.uploader_id
    ),
    note_ratings AS (
        -- Calculate average ratings for notes
        SELECT nr.note_id, AVG(nr.rating) as avg_rating, COUNT(*) as rating_count
        FROM note_rating nr
        GROUP BY nr.note_id
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
        COALESCE(nr.avg_rating, 0)::NUMERIC(3,1) AS average_rating,
        (
            CASE 
                WHEN n.department_id = user_dept_id AND n.batch = CAST(user_batch AS VARCHAR) THEN 100
                WHEN n.department_id = user_dept_id THEN 50
                ELSE 10
            END 
            + (n.upvotes * 2) 
            + n.downloads
            + COALESCE(ui.interaction_count * 15, 0) -- Higher weight for frequently interacted uploaders
            + COALESCE(ROUND(nr.avg_rating * 5), 0)::INT -- Bonus for high ratings
        ) AS relevance_score
    FROM note n
    LEFT JOIN course c ON n.course_id = c.course_id
    LEFT JOIN users u ON n.uploader_id = u.user_id
    LEFT JOIN uploader_interactions ui ON n.uploader_id = ui.uploader_id
    LEFT JOIN note_ratings nr ON n.note_id = nr.note_id
    WHERE n.uploader_id != target_user_id -- Exclude own notes
    AND n.note_id NOT IN ( -- Exclude already downloaded notes
        SELECT d.note_id FROM download d WHERE d.user_id = target_user_id
    )
    ORDER BY relevance_score DESC, n.created_at DESC
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
    average_rating NUMERIC,
    common_downloads BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    WITH target_downloaders AS (
        -- Get all users who downloaded the target note
        SELECT d.user_id FROM download d WHERE d.note_id = target_note_id
    ),
    related_notes_stats AS (
        -- Find other notes downloaded by these users and count overlap
        SELECT 
            d.note_id,
            COUNT(d.user_id) as common_count
        FROM download d
        WHERE d.user_id IN (SELECT t.user_id FROM target_downloaders t)
        AND d.note_id != target_note_id
        GROUP BY d.note_id
        HAVING COUNT(d.user_id) >= (
            CASE 
                WHEN (SELECT COUNT(*) FROM target_downloaders) > 5 THEN 2
                ELSE 1
            END
        ) -- Minimum overlap threshold
    ),
    note_ratings AS (
        SELECT nr.note_id, AVG(nr.rating) as avg_rating
        FROM note_rating nr
        GROUP BY nr.note_id
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
        COALESCE(nr.avg_rating, 0)::NUMERIC(3,1) AS average_rating,
        r.common_count AS common_downloads
    FROM related_notes_stats r

    JOIN note n ON r.note_id = n.note_id
    LEFT JOIN course c ON n.course_id = c.course_id
    LEFT JOIN users u ON n.uploader_id = u.user_id
    LEFT JOIN note_ratings nr ON n.note_id = nr.note_id
    ORDER BY r.common_count DESC, n.downloads DESC, n.upvotes DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

