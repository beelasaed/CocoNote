-- database/run.sql

\echo '----------------------------------'
\echo '⏳ STARTING DATABASE RESET...'
\echo '----------------------------------'

-- 1. Wipe everything clean
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 2. Run schema to create tables
\echo '... Creating Tables'
\i schema.sql

-- 3. (Optional) Run procedures/triggers if you have them
-- Uncomment these if you actually created these files
-- \echo '... Adding Procedures & Functions'
-- \i procedures.sql
-- \echo '... Adding Triggers'
-- \i triggers.sql

-- 4. Fill with dummy data
\echo '... Seeding Dummy Data'
\i seed.sql

\echo '----------------------------------'
\echo '✅ DATABASE READY!'
\echo '----------------------------------'