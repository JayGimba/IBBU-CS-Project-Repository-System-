<?php
require __DIR__ . '/config.php';
require_method('POST');

$username = clean('username');
$password = (string)($_POST['password'] ?? '');
if ($username === '' || $password === '') fail('Enter your username and password.');

$stmt = db()->prepare('SELECT id, fullname, password, role FROM users WHERE username = ?');
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    usleep(300000); // slow down password guessing
    fail('Incorrect username or password.', 401);
}

session_regenerate_id(true);
$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['fullname'] = $user['fullname'];
$_SESSION['role'] = $user['role'];
unset($_SESSION['csrf']);

respond(['success' => true, 'fullname' => $user['fullname'], 'role' => $user['role'], 'csrf' => csrf_token()]);
