<?php
require __DIR__ . '/config.php';
$stmt = db()->prepare('SELECT file_path, original_name FROM projects WHERE id = ?');
$stmt->execute([(int)($_GET['id'] ?? 0)]);
$p = $stmt->fetch();

$path = $p ? UPLOAD_DIR . $p['file_path'] : '';
if (!$p || !$p['file_path'] || !is_file($path)) {
    http_response_code(404);
    exit('No file has been uploaded for this project.');
}
$ext = strtolower(pathinfo($p['file_path'], PATHINFO_EXTENSION));
$types = ['pdf' => 'application/pdf', 'doc' => 'application/msword',
          'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
header('Content-Disposition: attachment; filename="' . str_replace(['"', "\r", "\n"], '', $p['original_name'] ?: ('project.' . $ext)) . '"');
header('Content-Length: ' . filesize($path));
header('X-Content-Type-Options: nosniff');
readfile($path);
