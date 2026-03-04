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
    downloads INT,
    average_rating NUMERIC(3,1),
    rating_count INT
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
        n.downloads,
        COALESCE(nrs.average_rating, 0) AS average_rating,
        COALESCE(nrs.rating_count, 0) AS rating_count
    FROM note n
    JOIN users u ON n.uploader_id = u.user_id
    JOIN course c ON n.course_id = c.course_id
    LEFT JOIN note_rating_stats nrs ON n.note_id = nrs.note_id
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
    average_rating NUMERIC(3,1),
    rating_count INT,
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
        v.average_rating,
        v.rating_count,
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
    average_rating NUMERIC(3,1),
    rating_count INT,
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
        v.average_rating,
        v.rating_count,
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
        )::INT AS relevance_score
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

