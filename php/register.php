<?php
// Super Admin creates a staff account.
require __DIR__ . '/config.php';
require_method('POST');
require_admin();
require_csrf();

$username = clean('username');
$fullname = clean('fullname');
$password = (string)($_POST['password'] ?? '');
if ($username === '' || $fullname === '') fail('Username and full name are required.');
if (!preg_match('/^[A-Za-z0-9._-]{3,50}$/', $username)) fail('Username must be 3-50 letters, numbers, dots, dashes or underscores.');
require_min_password_length($password);

$check = db()->prepare('SELECT id FROM users WHERE username = ?');
$check->execute([$username]);
if ($check->fetch()) fail('That username is already taken.');

db()->prepare('INSERT INTO users (username, fullname, password, role) VALUES (?,?,?,\'staff\')')
    ->execute([$username, $fullname, password_hash($password, PASSWORD_DEFAULT)]);
respond(['success' => true]);
