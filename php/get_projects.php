<?php
// Lists projects. Optional filters: q (title/student/supervisor), year, category.
// Also used for search (search_projects.php includes this file).
require __DIR__ . '/config.php';

$q        = trim((string)($_GET['q'] ?? ''));
$year     = (string)($_GET['year'] ?? 'all');
$category = (string)($_GET['category'] ?? 'all');

$where = []; $args = [];
if ($q !== '') {
    $like = '%' . addcslashes($q, '%_\\') . '%';
    $where[] = '(title LIKE ? OR student_name LIKE ? OR supervisor LIKE ? OR CAST(year AS CHAR) LIKE ?)';
    array_push($args, $like, $like, $like, $like);
}
if ($year !== '' && $year !== 'all')         { $where[] = 'year = ?';     $args[] = (int)$year; }
if ($category !== '' && $category !== 'all') { $where[] = 'category = ?'; $args[] = $category; }

$sql = 'SELECT * FROM projects' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY year DESC, id DESC';
$stmt = db()->prepare($sql);
$stmt->execute($args);

respond(['success' => true, 'projects' => array_map('public_project', $stmt->fetchAll())]);
