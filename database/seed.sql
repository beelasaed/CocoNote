-- 1. Departments --
INSERT INTO departments(name) VALUES 
('CSE'), ('ME'), ('CEE'), ('BTM'), ('EEE');

-- 2. Valid Student IDs --
INSERT INTO valid_student_ids(student_id)
SELECT generate_series(220041101, 220041130)::text;

INSERT INTO valid_student_ids(student_id) VALUES ('190041101') ON CONFLICT DO NOTHING;

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
INSERT INTO category(name) VALUES ('Slides'), ('Lab'), ('Papers'), ('Books');

-- 5. Badges --
INSERT INTO badge(name, description, points_required) VALUES
('Top Contributor','Uploaded 10+ notes', 10),
('Master Contributor','Uploaded 20+ notes', 20);

-- 6. Users --
INSERT INTO users(name, student_id, email, password, batch, department_id, total_points) VALUES
('Anika Tabassum', '220041128', 'anika@iut-dhaka.edu', '$2a$10$dummyhash1', 21, 1, 3820),
('Samiul Hasan', '220041129', 'samiul@iut-dhaka.edu', '$2a$10$dummyhash2', 19, 2, 2450),
('Fahim IUT', '190041101', 'fahim@iut-dhaka.edu', '$2a$10$dummyhash3', 20, 3, 1980);

-- 7. Sample Notes (UPDATED with description, batch, and department_id) --
INSERT INTO note(title, description, batch, department_id, course_id, category_id, uploader_id, file_path, uploads, downloads, upvotes)
VALUES
('Database Normalization Guide', 'Complete guide to 1NF, 2NF, 3NF with examples.', '21', 1, 1, 1, 1, 'uploads/db_normalization.pdf', 1, 100, 50),
('Thermodynamics Lab Report', 'Lab report on heat transfer experiment.', '21', 2, 2, 2, 2, 'uploads/thermo_lab.pdf', 1, 80, 30),
('Structural Analysis Past Paper', 'Midterm question paper from Spring 2023.', '20', 3, 3, 3, 3, 'uploads/structural_paper.pdf', 1, 120, 70);