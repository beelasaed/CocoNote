
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
    u.name AS uploader, 
    c.code AS course, 
    d.name AS department, 
    cat.name AS category
FROM note n
JOIN users u ON n.uploader_id = u.user_id
JOIN course c ON n.course_id = c.course_id
JOIN departments d ON n.department_id = d.department_id
JOIN category cat ON n.category_id = cat.category_id;