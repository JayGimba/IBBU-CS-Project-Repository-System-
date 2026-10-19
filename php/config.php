<?php
// Shared setup: database connection, sessions, JSON + auth helpers.
const DB_HOST = 'localhost';
const DB_PORT = 3306;
const DB_NAME = 'prs_repository';
const DB_USER = 'root';
const DB_PASS = '';            // XAMPP default is an empty password
const UPLOAD_DIR = __DIR__ . '/../uploads/';
const MAX_FILE_SIZE = 10 * 1024 * 1024;   // 10 MB
const CATEGORIES = ['Web Development', 'Artificial Intelligence', 'Database', 'Networking'];

session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
session_start();

function respond(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function fail(string $message, int $code = 400): void {
    respond(['success' => false, 'message' => $message], $code);
}

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            fail('Database connection failed.', 500);
        }
    }
    return $pdo;
}

function require_method(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== $method) fail('Method not allowed.', 405);
}

function require_login(): void {
    if (empty($_SESSION['user_id'])) fail('Please log in first.', 401);
}

function require_admin(): void {
    require_login();
    if (($_SESSION['role'] ?? '') !== 'admin') fail('Only the Super Admin can do this.', 403);
}

function csrf_token(): string {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

function require_csrf(): void {
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!$sent || !hash_equals($_SESSION['csrf'] ?? '', $sent)) fail('Invalid or missing security token. Refresh and try again.', 403);
}

function require_min_password_length(string $password): void {
    $length = preg_match_all('/./us', $password, $characters);
    if ($length === false) fail('Password must contain valid text.');
    if ($length < 8) fail('Password must be at least 8 characters.');
}

function clean(string $key): string {
    return trim((string)($_POST[$key] ?? ''));
}

// Validates the text fields shared by add_project and update_project.
function project_fields(): array {
    $f = [
        'title'        => clean('title'),
        'student_name' => clean('student_name'),
        'supervisor'   => clean('supervisor'),
        'year'         => (int)clean('year'),
        'category'     => clean('category'),
        'description'  => clean('description'),
    ];
    foreach (['title', 'student_name', 'supervisor', 'category', 'description'] as $k) {
        if ($f[$k] === '') fail('Please fill in all required fields.');
    }
    if ($f['year'] < 2000 || $f['year'] > 2100) fail('Enter a valid year.');
    if (!in_array($f['category'], CATEGORIES, true)) fail('Invalid category.');
    if (strlen($f['title']) > 255 || strlen($f['student_name']) > 100 || strlen($f['supervisor']) > 100) {
        fail('One of the fields is too long.');
    }
    return $f;
}

// Saves an optional uploaded report. Returns [stored_name, original_name] or null if none was sent.
function save_upload(): ?array {
    if (empty($_FILES['project_file']) || $_FILES['project_file']['error'] === UPLOAD_ERR_NO_FILE) return null;
    $file = $_FILES['project_file'];
    if ($file['error'] !== UPLOAD_ERR_OK) fail('File upload failed.');
    if ($file['size'] > MAX_FILE_SIZE) fail('File is too large (max 10 MB).');

    $allowed = [
        'pdf'  => ['application/pdf'],
        'doc'  => ['application/msword', 'application/octet-stream'],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
    ];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!isset($allowed[$ext])) fail('Only PDF, DOC or DOCX files are allowed.');
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!in_array($mime, $allowed[$ext], true)) fail('The file content does not match its type.');

    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
    $stored = bin2hex(random_bytes(16)) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], UPLOAD_DIR . $stored)) fail('Could not save the file.', 500);
    return [$stored, basename($file['name'])];
}

function delete_stored_file(?string $name): void {
    if ($name && is_file(UPLOAD_DIR . $name)) @unlink(UPLOAD_DIR . $name);
}

// Public shape of a project (never exposes the server file path).
function public_project(array $p): array {
    return [
        'id' => (int)$p['id'], 'title' => $p['title'], 'student_name' => $p['student_name'],
        'supervisor' => $p['supervisor'], 'year' => (int)$p['year'], 'category' => $p['category'],
        'description' => $p['description'], 'has_file' => !empty($p['file_path']),
    ];
}
