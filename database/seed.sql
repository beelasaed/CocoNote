
-- Departments--
INSERT INTO department(name) VALUES 
('CSE'), ('ME'), ('CEE'), ('BTM'), ('EEE');

-- Courses--
INSERT INTO course(name, code, department_id) VALUES
('Data Structures', 'CSE 2101', 4),
('Thermodynamics', 'ME 2201', 1),
('Structural Analysis', 'CEE 2301', 5),
('Operating Systems', 'CSE 4501', 4),
('Microprocessor and Assembly Language', 'CSE 4503', 4),
('Computer Networks', 'CSE 4511', 4),
('Software Engineering and Object-Oriented Design', 'CSE 4513', 4),
('Operating Systems Lab', 'CSE 4502', 4),
('Microprocessor and Assembly Language Lab', 'CSE 4504', 4),
('RDBMS Programming Lab', 'CSE 4508', 4),
('Software Development', 'CSE 4510', 4),
('Computer Networks Lab', 'CSE 4512', 4),
('Elective 5-II Lab', 'Elective 5-II Lab', 4);

-- Categories--
INSERT INTO category(name) VALUES ('Slides'), ('Lab'), ('Papers'), ('Books');

-- Badges--
INSERT INTO badge(name, description, points_required) VALUES
('Top Contributor','Uploaded 10+ notes', 10),
('Master Contributor','Uploaded 20+ notes', 20);

-- Users--
INSERT INTO users(name,email,password_hash,batch,department_id,total_points) VALUES
('Anika Tabassum','anika@univ.edu','hashed_pwd_1',21,1,3820),
('Samiul Hasan','samiul@univ.edu','hashed_pwd_2',19,2,2450),
('Fahim IUT','fahim@univ.edu','hashed_pwd_3',20,3,1980);

-- Sample Notes--
INSERT INTO note(title, course_id, category_id, uploader_id, file_path, uploads, downloads, upvotes)
VALUES
('Database Normalization Guide',1,1,1,'uploads/db_normalization.pdf',1,100,50),
('Thermodynamics Lab Report',2,2,2,'uploads/thermo_lab.pdf',1,80,30),
('Structural Analysis Past Paper',3,3,3,'uploads/structural_paper.pdf',1,120,70);
