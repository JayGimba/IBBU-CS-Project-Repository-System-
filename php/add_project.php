<?php
require __DIR__ . '/config.php';
require_method('POST');
require_login();
require_csrf();

$f = project_fields();
$file = save_upload();

db()->prepare('INSERT INTO projects (title, student_name, supervisor, year, category, description, file_path, original_name, created_by)
               VALUES (?,?,?,?,?,?,?,?,?)')
    ->execute([$f['title'], $f['student_name'], $f['supervisor'], $f['year'], $f['category'], $f['description'],
               $file[0] ?? null, $file[1] ?? null, $_SESSION['user_id']]);

respond(['success' => true, 'id' => (int)db()->lastInsertId()]);
