<?php
require __DIR__ . '/config.php';
if (empty($_SESSION['user_id'])) respond(['success' => true, 'loggedIn' => false]);
respond([
    'success' => true, 'loggedIn' => true,
    'fullname' => $_SESSION['fullname'], 'role' => $_SESSION['role'], 'csrf' => csrf_token(),
]);
