<?php
require_once __DIR__ . '/../version.php';
date_default_timezone_set('America/Phoenix');

$dbPath = __DIR__ . '/../data/log.db';
$rows = [];

if (file_exists($dbPath)) {
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('PRAGMA busy_timeout = 5000');
    $stmt = $db->query("SELECT * FROM sessions ORDER BY id DESC LIMIT 100");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Usage Log - Sublogical Endeavors</title>
    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    <link rel="stylesheet" href="../dist/output.css?v=<?= $version ?>">
    <link rel="stylesheet" href="../dist/fonts.css?v=<?= $version ?>">
    <style>
        body { font-family: 'Courier Prime', monospace; }
        h1, h2, .label-text { font-family: 'Cinzel', serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { padding: 0.4rem 0.6rem; text-align: center; white-space: nowrap; }
        th { border-bottom: 2px solid #5a4a2a; }
        td { border-bottom: 1px solid #3a3a3a; }
        tr:hover td { background: rgba(212, 168, 75, 0.08); }
    </style>
</head>
<body class="min-h-screen">
    <div class="p-4 lg:p-8 mx-auto" style="max-width: 1100px;">

        <!-- Header -->
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold mb-2 text-brass-light tracking-wider">Sublogical Endeavors</h1>
            <div class="flex items-center justify-center gap-3 mb-3">
                <div class="rivet"></div>
                <div class="h-px w-16 bg-brass-dark"></div>
                <span class="text-brass uppercase tracking-widest text-sm">Usage Log</span>
                <div class="h-px w-16 bg-brass-dark"></div>
                <div class="rivet"></div>
            </div>
            <p class="text-steam text-sm mb-4">Last 100 sessions</p>
            <a href="../" class="text-copper text-sm hover:text-brass transition-colors">&larr; Back to Imager</a>
        </div>

        <!-- Log Table -->
        <div class="panel p-6 mb-4 overflow-x-auto">
            <div class="absolute top-2 left-2 rivet"></div>
            <div class="absolute top-2 right-2 rivet"></div>
            <div class="absolute bottom-2 left-2 rivet"></div>
            <div class="absolute bottom-2 right-2 rivet"></div>

            <?php if (empty($rows)): ?>
                <p class="text-steam text-sm text-center">No sessions recorded yet.</p>
            <?php else: ?>
                <table class="text-sm">
                    <thead>
                        <tr class="text-brass uppercase tracking-wider text-xs">
                            <th>Date/Time</th>
                            <th>Images</th>
                            <th>Max W</th>
                            <th>Max H</th>
                            <th>Ratio</th>
                            <th>Mode</th>
                            <th>Text</th>
                            <th>Process</th>
                            <th>Preview</th>
                            <th>Download</th>
                        </tr>
                    </thead>
                    <tbody class="text-steam">
                        <?php foreach ($rows as $row): ?>
                            <?php
                                $utc = new DateTime($row['created_at'], new DateTimeZone('UTC'));
                                $utc->setTimezone(new DateTimeZone('America/Phoenix'));
                                $display = $utc->format('M j, g:ia');
                            ?>
                            <tr>
                                <td class="text-left"><?= htmlspecialchars($display) ?></td>
                                <td><?= (int)$row['image_count'] ?></td>
                                <td><?= $row['max_width'] ? (int)$row['max_width'] : ' - ' ?></td>
                                <td><?= $row['max_height'] ? (int)$row['max_height'] : ' - ' ?></td>
                                <td><?= $row['aspect_ratio'] ?: ' - ' ?></td>
                                <td><?= $row['resize_mode'] ?></td>
                                <td><?= (int)$row['text_added'] ?></td>
                                <td><?= (int)$row['clicks_process'] ?></td>
                                <td><?= (int)$row['clicks_preview'] ?></td>
                                <td><?= (int)$row['clicks_download'] ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center">
            <div class="flex items-center justify-center gap-2">
                <div class="rivet"></div>
                <div class="h-px w-16 bg-iron-light"></div>
                <a href="../" class="btn-secondary px-4 py-1.5 rounded text-xs whitespace-nowrap inline-block no-underline">
                    &larr; Back to Imager
                </a>
                <div class="h-px w-16 bg-iron-light"></div>
                <div class="rivet"></div>
            </div>
            <p class="text-steam text-xs mt-3 uppercase tracking-wider">Est. 2026 <a href="https://www.sublogicalendeavors.com/" target="_blank">Sublogical Endeavors</a></p>
        </div>
    </div>
</body>
</html>
