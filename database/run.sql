\echo '----------------------------------'
\echo ' STARTING FULL DATABASE RESET...'
\echo '----------------------------------'

-- 1. Reset Environment
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 2. Base Tables
\echo '... Creating Tables (Schema)'
\i schema.sql

-- 2b. Notifications Table
\echo '... Creating Notifications Table'
\i notifications.sql

-- 3. Logic & Functions 
-- (Functions must exist before Triggers can use them)
\echo '...  Adding Functions'
\i functions.sql

\echo '...  Adding Procedures'
\i procedures.sql

-- 4. Dependent Objects
\echo '... Adding Triggers'
\i triggers.sql

\echo '...  Adding Views'
\i views.sql

-- 5. Data
\echo '... Seeding Dummy Data'
\i seed.sql

\echo '----------------------------------'
\echo ' DATABASE FULLY INITIALIZED!'
\echo '----------------------------------'