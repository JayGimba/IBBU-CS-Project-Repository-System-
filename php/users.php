<?php
// Super Admin: GET lists staff accounts, POST with id deletes one.
require __DIR__ . '/config.php';
require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_csrf();
    $id = (int)clean('id');
    if ($id === (int)$_SESSION['user_id']) fail('You cannot delete your own account.');
    db()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    respond(['success' => true]);
}
$stmt = db()->prepare('SELECT id, username, fullname FROM users WHERE role = ? ORDER BY id');
$stmt->execute(['staff']);
$rows = $stmt->fetchAll();
respond(['success' => true, 'users' => $rows]);
