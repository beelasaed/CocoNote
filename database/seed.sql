-- 1. Departments --
INSERT INTO departments(name) VALUES 
('CSE'), ('ME'), ('CEE'), ('BTM'), ('EEE'), ('TVE');

-- 2. Valid Student IDs --
INSERT INTO valid_student_ids(student_id)
SELECT generate_series(220041101, 220041165)::text;

INSERT INTO valid_student_ids(student_id) VALUES ('190041101') ON CONFLICT DO NOTHING;
INSERT INTO valid_student_ids(student_id) VALUES ('210041128') ON CONFLICT DO NOTHING;
INSERT INTO valid_student_ids(student_id) VALUES ('210041129') ON CONFLICT DO NOTHING;

-- 3. Courses --
INSERT INTO course(name, code, department_id) VALUES
('Data Structures', 'CSE 2101', 1),
('Thermodynamics', 'ME 2201', 2),
('Structural Analysis', 'CEE 2301', 3),
('Operating Systems', 'CSE 4501', 1),
('Microprocessor and Assembly Language', 'CSE 4503', 1),
('Computer Networks', 'CSE 4511', 1),
('Software Engineering and Object-Oriented Design', 'CSE 4513', 1),
('Operating Systems Lab', 'CSE 4502', 1),
('Microprocessor and Assembly Language Lab', 'CSE 4504', 1),
('RDBMS Programming Lab', 'CSE 4508', 1),
('Software Development', 'CSE 4510', 1),
('Computer Networks Lab', 'CSE 4512', 1),
('Elective 5-II Lab', 'CSE 4599', 1);

-- 4. Categories --
INSERT INTO category(name) VALUES ('Lecture Slides'), ('Lab'), ('Past Papers'), ('Books'), ('Manuals');

-- 5. Badges --
INSERT INTO badge(name, description, points_required) VALUES
('Getting Started', 'Upload at least 1 note', 0),
('Prolific Creator', 'Upload 10 or more notes', 0),
('Popular Author', 'Receive 50 or more total upvotes', 0),
('Viral Creator', 'Get 200 or more total downloads', 0),
('Coconut Expert', 'Earn 1,000 coconut points', 1000),
('CocoNote Legend', 'Upload 10+ notes, 50+ upvotes, 3000+ points', 3000);

-- 6. Users --
INSERT INTO users(name, student_id, email, password, batch, department_id, total_points) VALUES
('Anika Tabassum', '210041128', 'anika@iut-dhaka.edu', '$2a$10$dummyhash1', 21, 1, 3820),
('Samiul Hasan', '210041129', 'samiul@iut-dhaka.edu', '$2a$10$dummyhash2', 19, 2, 2450),
('Fahim IUT', '190041101', 'fahim@iut-dhaka.edu', '$2a$10$dummyhash3', 20, 3, 1980);

-- 7. Sample Notes (UPDATED with description, batch, and department_id) --
INSERT INTO note(title, description, batch, department_id, course_id, category_id, uploader_id, file_path, uploads, downloads, upvotes)
VALUES
('Database Normalization Guide', 'Complete guide to 1NF, 2NF, 3NF with examples.', '21', 1, 1, 1, 1, 'uploads/db_normalization.pdf', 1, 100, 50),
('Thermodynamics Lab Report', 'Lab report on heat transfer experiment.', '21', 2, 2, 2, 2, 'uploads/thermo_lab.pdf', 1, 80, 30),
('Structural Analysis Past Paper', 'Midterm question paper from Spring 2023.', '20', 3, 3, 3, 3, 'uploads/structural_paper.pdf', 1, 120, 70);

-- 8. Sample Saved Notes --
-- User 1 (Anika) saves notes from User 2 and User 3
INSERT INTO saved_note(user_id, note_id) VALUES
(1, 2),
(1, 3);

-- User 2 (Samiul) saves note from User 1
INSERT INTO saved_note(user_id, note_id) VALUES
(2, 1);