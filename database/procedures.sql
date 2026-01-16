
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
