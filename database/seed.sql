-- 1. Departments --
INSERT INTO department(name) VALUES 
('CSE'), ('ME'), ('CEE'), ('BTM'), ('EEE');

-- 2. Courses --
-- Note: I corrected the department_id logic (CSE is 1, ME is 2, etc.)
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

-- 3. Categories --
INSERT INTO category(name) VALUES ('Slides'), ('Lab'), ('Papers'), ('Books');

-- 4. Badges --
INSERT INTO badge(name, description, points_required) VALUES
('Top Contributor','Uploaded 10+ notes', 10),
('Master Contributor','Uploaded 20+ notes', 20);

-- 5. VALID STUDENT IDs (New Requirement) --
-- You MUST populate this before adding users
INSERT INTO valid_student_ids(student_id) VALUES
('220041128'),
('220041129'),
('190041101');

-- 6. Users (Updated with student_id and IUT emails) --
INSERT INTO users(name, student_id, email, password_hash, batch, department_id, total_points) VALUES
('Anika Tabassum', '220041128', 'anika@iut-dhaka.edu', 'hashed_pwd_1', 21, 1, 3820),
('Samiul Hasan', '220041129', 'samiul@iut-dhaka.edu', 'hashed_pwd_2', 19, 2, 2450),
('Fahim IUT', '190041101', 'fahim@iut-dhaka.edu', 'hashed_pwd_3', 20, 3, 1980);

-- 7. Sample Notes --
INSERT INTO note(title, course_id, category_id, uploader_id, file_path, uploads, downloads, upvotes)
VALUES
('Database Normalization Guide', 1, 1, 1, 'uploads/db_normalization.pdf', 1, 100, 50),
('Thermodynamics Lab Report', 2, 2, 2, 'uploads/thermo_lab.pdf', 1, 80, 30),
('Structural Analysis Past Paper', 3, 3, 3, 'uploads/structural_paper.pdf', 1, 120, 70);