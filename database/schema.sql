
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


CREATE TABLE valid_student_ids (
    student_id VARCHAR(20) PRIMARY KEY
);



CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL REFERENCES valid_student_ids(student_id),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    batch INT,
    department_id INT REFERENCES departments(department_id),
    bio TEXT,
    profile_picture VARCHAR(255),
    total_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE course (
    course_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    department_id INT REFERENCES departments(department_id)
);

CREATE TABLE note (
    note_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    
  
    description TEXT,
    batch VARCHAR(10),
    department_id INT REFERENCES departments(department_id),
    
    course_id INT REFERENCES course(course_id),
    category_id INT REFERENCES category(category_id),
    uploader_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    file_path VARCHAR(255) NOT NULL,
    uploads INT DEFAULT 0,
    downloads INT DEFAULT 0,
    upvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


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

CREATE TABLE saved_note (
    saved_note_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    note_id INT NOT NULL REFERENCES note(note_id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, note_id)
);
CREATE TABLE note_rating (
    rating_id SERIAL PRIMARY KEY,
    note_id INT REFERENCES note(note_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    rated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (note_id, user_id)
);

CREATE TABLE IF NOT EXISTS note_version (
    version_id SERIAL PRIMARY KEY,
    note_id INT REFERENCES note(note_id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    changes_description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
