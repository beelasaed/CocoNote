# CocoNote
A database‑driven academic resource hub for IUT student

## Overview

CocoNote is a university-focused web platform where students can upload, share, download, and upvote academic notes.
It is designed as a DBMS-centric project, featuring:

- Multi-table entity relationships 

- Junction tables for many-to-many connections

- Complex SQL joins, triggers, and stored procedures

- Automated badge awarding

- Usage statistics and analytics

The platform organizes notes by department, course, semester, and category, helping students quickly find the resources they need.

## Key Features
### User & Authentication

- Students can create accounts

- Each user has badges and statistics

### Notes Management

Upload PDFs.

Each note includes:
  
  - Title and description

  - Category (Past Papers, Lab Materials, Lecture Notes, etc.)
  
  - Linked department and course
  
  - Upload date, file size, type

### Engagement Features


- Users can upvote notes

- Users can download notes

- Automatic counters for upvotes and downloads

### Gamification with Badges

- Badges are awarded automatically based on:

- Upload milestones

- Upvote milestones

- Download milestones

### Analytics Dashboard

- Most downloaded notes

- Top contributors

- Course-wise activity

- Department-wise usage trends

## Database Design (ERD Summary)

### Core entities:
User, Department, Course, Category, Note, Download, Upvote, Badge, User_Badge.

### Highlights:

- Proper normalization

- Clear foreign keys and cascading rules

- Many-to-many relationships using junction tables

- Triggers for automated operations

## Tech Stack

  - Frontend: HTML, CSS, JS (or any modern framework)
  
  - Backend: Node.js and Express.js
  
  - Database: PostgreSQL
  
  - Version Control: Github

## DBMS-Focused Functionalities

This project demonstrates advanced SQL including:

  - Multi-table JOINs

  - Aggregations 

  - Triggers 

  - Stored procedures 

  - Referential integrity and constraints

  - Audit logging

## Project Goals

- Build a production-style relational database

- Demonstrate SQL mastery (triggers, procedures, constraints)

- Deliver a functional note-sharing platform

- Encourage academic collaboration
