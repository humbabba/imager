<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

$dataDir = __DIR__ . '/../data';
$dbPath  = $dataDir . '/log.db';

try {
    // Auto-create data directory
    if (!is_dir($dataDir)) {
        if (!mkdir($dataDir, 0755, true)) {
            throw new RuntimeException("Failed to create data directory: $dataDir");
        }
    }

    if (!is_writable($dataDir)) {
        throw new RuntimeException("Data directory is not writable: $dataDir");
    }

    // Open/create SQLite database via PDO
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('PRAGMA journal_mode = WAL');
    $db->exec('PRAGMA busy_timeout = 5000');

    // Auto-create table
    $db->exec("
        CREATE TABLE IF NOT EXISTS sessions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id      TEXT NOT NULL UNIQUE,
            created_at      TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
            image_count     INTEGER NOT NULL DEFAULT 0,
            max_width       INTEGER,
            max_height      INTEGER,
            aspect_ratio    TEXT DEFAULT '',
            resize_mode     TEXT DEFAULT 'crop',
            text_added      INTEGER NOT NULL DEFAULT 0,
            clicks_process  INTEGER NOT NULL DEFAULT 0,
            clicks_preview  INTEGER NOT NULL DEFAULT 0,
            clicks_download INTEGER NOT NULL DEFAULT 0
        )
    ");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['session_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing session_id']);
        exit;
    }

    $stmt = $db->prepare("
        INSERT INTO sessions (session_id, image_count, max_width, max_height, aspect_ratio, resize_mode, text_added, clicks_process, clicks_preview, clicks_download)
        VALUES (:sid, :ic, :mw, :mh, :ar, :rm, :ta, :cp, :cpv, :cd)
        ON CONFLICT(session_id) DO UPDATE SET
            updated_at      = datetime('now'),
            image_count     = :ic,
            max_width       = :mw,
            max_height      = :mh,
            aspect_ratio    = :ar,
            resize_mode     = :rm,
            text_added      = :ta,
            clicks_process  = :cp,
            clicks_preview  = :cpv,
            clicks_download = :cd
    ");

    $stmt->execute([
        ':sid' => $input['session_id'],
        ':ic'  => $input['image_count'] ?? 0,
        ':mw'  => $input['max_width'] ?? null,
        ':mh'  => $input['max_height'] ?? null,
        ':ar'  => $input['aspect_ratio'] ?? '',
        ':rm'  => $input['resize_mode'] ?? 'crop',
        ':ta'  => $input['text_added'] ?? 0,
        ':cp'  => $input['clicks_process'] ?? 0,
        ':cpv' => $input['clicks_preview'] ?? 0,
        ':cd'  => $input['clicks_download'] ?? 0,
    ]);

    echo json_encode(['ok' => true]);

} elseif ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM sessions ORDER BY id DESC LIMIT 100");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
