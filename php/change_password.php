<?php
require __DIR__ . '/config.php';
require_method('POST');
require_login();
require_csrf();

$currentPassword = (string)($_POST['current_password'] ?? '');
$newPassword = (string)($_POST['new_password'] ?? '');
if ($currentPassword === '' || $newPassword === '') fail('Enter your current and new passwords.');
require_min_password_length($newPassword);

$stmt = db()->prepare('SELECT password FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
if (!$user) fail('Please log in again.', 401);
if (!password_verify($currentPassword, $user['password'])) fail('Current password is incorrect.', 400);

$hash = password_hash($newPassword, PASSWORD_DEFAULT);
db()->prepare('UPDATE users SET password = ? WHERE id = ?')->execute([$hash, $_SESSION['user_id']]);
respond(['success' => true]);
