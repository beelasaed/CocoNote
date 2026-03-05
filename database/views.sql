-- ==========================================
-- OPTIMIZED VIEWS FOR COCONOTE
-- ==========================================

-- ==========================================
-- 1. NOTE_RATING_STATS
-- ==========================================


CREATE OR REPLACE VIEW note_rating_stats AS
SELECT 
    note_id,
    AVG(rating)::numeric(3,1) AS average_rating,
    COUNT(*)::INT AS rating_count
FROM note_rating
GROUP BY note_id;

-- ==========================================
-- 2. VIEW_FEED_DETAILS (OPTIMIZED)
-- ==========================================


CREATE OR REPLACE VIEW view_feed_details AS
SELECT 
    n.note_id, 
    n.title, 
    n.description, 
    n.file_path, 
    n.created_at, 
    n.batch,
    n.upvotes, 
    n.downloads, 
    COALESCE(nrs.average_rating, 0) AS average_rating,
    COALESCE(nrs.rating_count, 0) AS rating_count,
    u.name AS uploader, 
    c.code AS course, 
    d.name AS department, 
    cat.name AS category
FROM note n
JOIN users u ON n.uploader_id = u.user_id
JOIN course c ON n.course_id = c.course_id
JOIN departments d ON n.department_id = d.department_id
JOIN category cat ON n.category_id = cat.category_id
LEFT JOIN note_rating_stats nrs ON n.note_id = nrs.note_id;

-- ==========================================
-- 3. NOTE_WITH_DETAILS
-- ==========================================


CREATE OR REPLACE VIEW note_with_details AS
SELECT 
    n.note_id,
    n.title,
    n.description,
    n.batch,
    n.upvotes,
    n.downloads,
    n.file_path,
    n.created_at,
    n.uploader_id,
    COALESCE(nrs.average_rating, 0) AS average_rating,
    COALESCE(nrs.rating_count, 0) AS rating_count,
    c.name AS category,
    co.code AS course_code,
    co.name AS course,
    d.name AS department,
    u.name AS uploader,
    u.student_id AS uploader_student_id
FROM note n
LEFT JOIN category c ON n.category_id = c.category_id
LEFT JOIN course co ON n.course_id = co.course_id
LEFT JOIN departments d ON n.department_id = d.department_id
LEFT JOIN users u ON n.uploader_id = u.user_id
LEFT JOIN note_rating_stats nrs ON n.note_id = nrs.note_id;

-- ==========================================
-- 4. USER_STATS
-- ==========================================

CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.user_id,
    COUNT(DISTINCT n.note_id) AS notes_uploaded,
    COALESCE(SUM(n.downloads), 0) AS total_downloads,
    COALESCE(SUM(n.upvotes), 0) AS total_upvotes,
    (SELECT COUNT(*) FROM stars WHERE target_id = u.user_id AND target_type = 'user') AS follower_count,
    (SELECT COUNT(*) FROM stars WHERE user_id = u.user_id AND target_type = 'user') AS following_count
FROM users u
LEFT JOIN note n ON n.uploader_id = u.user_id
GROUP BY u.user_id;