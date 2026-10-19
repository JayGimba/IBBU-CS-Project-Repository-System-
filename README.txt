IBBU CSS Project Repository - setup (XAMPP)

1. Copy this whole "PRS" folder into  C:\xampp\htdocs\
2. Start Apache and MySQL in the XAMPP control panel.
3. Open http://localhost/phpmyadmin -> Import -> choose database.sql -> Go.
4. Open http://localhost/PRS/PRS.html
5. Staff login:  admin / Admin@12345   (change this password in phpMyAdmin after first login;
   passwords are stored as bcrypt hashes, so generate a new one with PHP's password_hash()).

To use a different database server or account, edit DB_HOST, DB_PORT, DB_NAME, DB_USER
and DB_PASS at the top of php/config.php. The frontend uses paths relative to the
application, so it can be hosted under a different domain or URL path.

To reset the admin password without adding a PHP endpoint:
1. Generate a bcrypt hash locally with PHP CLI (replace the placeholder with your new password):
   php -r "echo password_hash('YOUR_NEW_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
2. Copy the generated hash into phpMyAdmin's SQL tab and run:
   UPDATE users
   SET password = '<PASTE_BCRYPT_HASH_HERE>', updated_at = CURRENT_TIMESTAMP
   WHERE username = 'admin' AND role = 'admin';
Use your actual admin username if it has been changed. Do not put the plaintext password
in the SQL statement; replace the hash placeholder with the output from PHP.

Uploaded reports are saved in /uploads (blocked from direct access by .htaccess) and are
only served through php/download_project.php.

Endpoints (php/): login, logout, check_session, get_projects, search_projects, get_project,
add_project, update_project, delete_project, download_project, register (admin: create staff),
users (admin: list/delete staff).

Manual test checklist:
1. Log in with valid credentials, then try an incorrect password and confirm an inline error.
2. Add a project with a valid PDF; confirm it appears in the list and dashboard.
3. Search separately by project title, student name, supervisor and year; also test the
   year and category dropdown filters and a combination of filters.
4. Open the project details, edit the project, and download its PDF.
5. Delete the project and confirm it no longer appears in the dashboard or public list.
6. As admin, create a staff account, confirm it appears in Staff Accounts, then delete it.
   Confirm the logged-in admin is not offered for deletion.
7. Submit an incorrect current password in Change Password and confirm it is rejected.
8. Send a project write request without a logged-in session and confirm HTTP 401.
9. With a logged-in session, send a write request without the X-CSRF-Token header and
   confirm HTTP 403.
