<?php
require __DIR__ . '/config.php';
require_method('POST');
require_login();
require_csrf();

$id = (int)clean('id');
$stmt = db()->prepare('SELECT file_path FROM projects WHERE id = ?');
$stmt->execute([$id]);
$existing = $stmt->fetch();
if (!$existing) fail('Project not found.', 404);

$f = project_fields();
$file = save_upload();

if ($file) {
    db()->prepare('UPDATE projects SET title=?, student_name=?, supervisor=?, year=?, category=?, description=?, file_path=?, original_name=? WHERE id=?')
        ->execute([$f['title'], $f['student_name'], $f['supervisor'], $f['year'], $f['category'], $f['description'], $file[0], $file[1], $id]);
    delete_stored_file($existing['file_path']);   // replace the old report
} else {
    db()->prepare('UPDATE projects SET title=?, student_name=?, supervisor=?, year=?, category=?, description=? WHERE id=?')
        ->execute([$f['title'], $f['student_name'], $f['supervisor'], $f['year'], $f['category'], $f['description'], $id]);
}
respond(['success' => true]);
