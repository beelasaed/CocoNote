# CocoNote – University Note Sharing Platform

*A database-driven academic resource hub for students*

---
## Overview

**CocoNote** is a university-focused web application where students can **upload, share, download, and upvote academic notes**.

This project is **RDBMS-centric** and demonstrates:

- Advanced relational database design
- Complex SQL queries and stored procedures
- Automated engagement features via triggers
- Data integrity and normalization

Notes are organized by **Department, Course, Semester, and Category** for easy access.

---

## Features

### User Management

- Student account creation with email verification
- Profile with activity statistics
- Badge rewards system (6 achievement tiers)
- Google Authentication support
- Password reset functionality

### Notes Management

- Upload & manage notes (PDF, image, docs)
- Secure file handling via **Multer**
- Categorization: Exam Papers, Lab Materials, Lecture Notes, Cheat Sheets, etc.
- Course & department-based organization
- Version history tracking with update notifications
- Plagiarism detection via title similarity (using PostgreSQL `pg_trgm`)

### Engagement System

- Upvoting system with constraints (no self-upvotes)
- Download tracking for analytics
- Automatic counter updates using SQL triggers
- Real-time notifications for interactions
- Comment threading with nested replies
- Comment voting (upvote/downvote)

### Badge System

Automatically assigned badges based on achievements:

- **Getting Started** – 1+ uploads
- **Prolific Creator** – 10+ uploads
- **Popular Author** – 50+ upvotes
- **Viral Creator** – 200+ downloads
- **Coconut Expert** – 1000+ points
- **CocoNote Legend** – 10+ uploads AND 50+ upvotes AND 3000+ points

### Recommendation Engine

- **Personalized recommendations** – weighted scoring based on department, batch, popularity, and user interaction history

### Analytics & Reporting

- Top contributors leaderboard
- Most downloaded notes
- Department-wise activity metrics
- Course-wise statistics
- User profile stats (uploads, downloads, followers)

---

## Tech Stack

| Layer              | Technology                                                     |
| ------------------ | -------------------------------------------------------------- |
| **Frontend**       | HTML5, CSS3, JavaScript (Vanilla)                              |
| **Backend**        | Node.js, Express.js                                            |
| **File Storage**   | Multer (server-side file system) + URL path stored in database |
| **Authentication** | JWT, Google OAuth 2.0                                          |
| **Extensions**     | PostgreSQL `pg_trgm` (similarity checks)                       |

---
## Installation & Setup

### Prerequisites

- Node.js (v14+) and npm
- PostgreSQL (v12+)
- Git

### Database Setup

1. **Open PostgreSQL terminal** (`psql`) or SQL client (pgAdmin):

   ```sql
   CREATE DATABASE CocoNoteDB;
   ```

2. **Run the initialization script** from the database folder:

   ```bash
   cd database
   psql -d CocoNoteDB -f run.sql
   cd ..
   ```

  This will:

   - Create all 18 tables with constraints
   - Define 21 SQL functions
   - Set up 13 triggers for automation
   - Create 4 optimized views
   - Insert seed data

### Backend Setup

1. **Navigate to backend folder:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

  
3. **Install additional required libraries:**

   ```bash
   npm install multer google-auth-library jsonwebtoken dotenv
   ```

  

4. **Create a `.env` file** in the `backend` folder with your credentials:

   ```env
   # Database Configuration

   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=CocoNoteDB

   # Server Configuration

   PORT=3000
   NODE_ENV=development

   # Authentication

   JWT_SECRET=your_random_secret_key_min_32_chars
   GOOGLE_CLIENT_ID=your_google_client_id

   ```

  
5. **Start the backend server:**

   ```bash
   node server.js
   ```

  Server will run on `http://localhost:3000`

---
## Project Structure

  
```

CocoNote/

├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection pool
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/                   # Uploaded note files
│   ├── server.js                 # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── index.html                # Main entry page
│   ├── assets/
│   │   └── css/                  # the css files
│   ├── pages/                    # html files
│   └── screens/                  # frontend js files
│
├── database/
│   ├── schema.sql               # 18 tables, constraints, PKs, FKs
│   ├── functions.sql            # 10 general-purpose SQL functions
│   ├── triggers.sql             # 13 triggers for automation
│   ├── views.sql                # 4 optimized database views
│   ├── indexes.sql              # Performance indexes
│   ├── seed.sql                 # Sample data
│   └── run.sql                  # Master script (runs all above)
├── README.md
├── package.json
└── .gitignore

```

---
## Database Highlights

### 21 SQL Functions

- **10 general functions:** search, feed retrieval, recommendations, upload, voting
- **11 trigger functions:** stats updates, badge assignment, comment handling, notifications
  
### 13 Automated Triggers

- **Gamification:** Auto-assign badges & points on interactions
- **Counters:** Keep note.upvotes, note.downloads, comment.score synced
- **Notifications:** Create events for upvotes, downloads, comments, follows
- **Quality checks:** Plagiarism detection via title similarity
  
### 4 Optimized Views

- `note_rating_stats` – Pre-aggregated ratings
- `view_feed_details` – Feed-ready note projection
- `note_with_details` – Comprehensive note view
- `user_stats` – Profile aggregations
  
### Data Integrity

- 24+ foreign key constraints with cascade delete
- UNIQUE constraints preventing duplicates (e.g., one upvote per user per note)
- CHECK constraints on batch range, rating scale, vote types
- Automatic timestamp tracking (created_at, updated_at)
---

## Contributors

- **Saeera Tanjim (ID: 220041107)** – [sasasaee](https://github.com/sasasaee)
- **Maisha Sanjida (220041128)** – [Loona6](https://github.com/Loona6)    
- **Salsabil Said Sabry (ID: 220041161)** – [beelasaed](https://github.com/beelasaed)

---
## License

This project is developed for **academic and educational purposes only**.

---

**Last Updated:** March 2026
