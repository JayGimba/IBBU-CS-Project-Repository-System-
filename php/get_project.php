<?php
require __DIR__ . '/config.php';
$stmt = db()->prepare('SELECT * FROM projects WHERE id = ?');
$stmt->execute([(int)($_GET['id'] ?? 0)]);
$p = $stmt->fetch();
if (!$p) fail('Project not found.', 404);
respond(['success' => true, 'project' => public_project($p)]);
