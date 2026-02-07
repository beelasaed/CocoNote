\echo '----------------------------------'
\echo ' STARTING FULL DATABASE RESET...'
\echo '----------------------------------'


DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

\echo '... Creating Tables (Schema)'
\i schema.sql

\echo '... Creating Notifications Table'
\i notifications.sql

\echo '...  Adding Functions'
\i functions.sql

\echo '...  Adding Procedures'
\i procedures.sql

\echo '... Adding Triggers'
\i triggers.sql

\echo '...  Adding Views'
\i views.sql

\echo '... Seeding Dummy Data'
\i seed.sql

\echo '----------------------------------'
\echo ' DATABASE FULLY INITIALIZED!'
\echo '----------------------------------'