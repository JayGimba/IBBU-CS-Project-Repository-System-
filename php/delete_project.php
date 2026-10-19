<?php
require __DIR__ . '/config.php';
require_method('POST');
require_login();
require_csrf();

$id = (int)clean('id');
$stmt = db()->prepare('SELECT file_path FROM projects WHERE id = ?');
$stmt->execute([$id]);
$p = $stmt->fetch();
if (!$p) fail('Project not found.', 404);

db()->prepare('DELETE FROM projects WHERE id = ?')->execute([$id]);
delete_stored_file($p['file_path']);
respond(['success' => true]);
