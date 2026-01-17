-- database/run.sql

\echo '----------------------------------'
\echo '⏳ STARTING DATABASE RESET...'
\echo '----------------------------------'

-- 1. Wipe everything clean
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 2. Run your specific files (Order matters!)
\echo '... Creating Tables'
\i schema.sql

\echo '... Adding Procedures & Functions'
\i procedures.sql

\echo '... Adding Triggers'
\i triggers.sql

\echo '... Seeding Dummy Data'
\i seed.sql

\echo '----------------------------------'
\echo '✅ DATABASE READY!'
\echo '----------------------------------'