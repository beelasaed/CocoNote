-- 1. Independent Tables (Must come first) --

CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE badge (
    badge_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    points_required INT DEFAULT 0
);

-- Whitelist for valid Student IDs
CREATE TABLE valid_student_ids (
    student_id VARCHAR(20) PRIMARY KEY
);

-- 2. Dependent Tables (Reference the tables above) --

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL REFERENCES valid_student_ids(student_id),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    batch INT,
    department_id INT REFERENCES departments(department_id),
    total_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE course (
    course_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    department_id INT REFERENCES departments(department_id)
);

-- 3. Note Table (UPDATED with new columns) --
CREATE TABLE note (
    note_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    
    -- NEW COLUMNS ADDED HERE
    description TEXT,
    batch VARCHAR(10),
    department_id INT REFERENCES departments(department_id),
    
    course_id INT REFERENCES course(course_id),
    category_id INT REFERENCES category(category_id),
    uploader_id INT REFERENCES users(user_id),
    file_path VARCHAR(255) NOT NULL,
    uploads INT DEFAULT 0,
    downloads INT DEFAULT 0,
    upvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Action Tables --
CREATE TABLE download (
    download_id SERIAL PRIMARY KEY,
    note_id INT REFERENCES note(note_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE upvote (
    upvote_id SERIAL PRIMARY KEY,
    note_id INT REFERENCES note(note_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    upvoted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (note_id, user_id)
);

CREATE TABLE user_badge (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    badge_id INT REFERENCES badge(badge_id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);