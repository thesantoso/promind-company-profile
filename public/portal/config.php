<?php
// PROMIND Portal Configuration
// Auto-generated & securely managed

if (!defined('PROMIND_PORTAL')) {
    http_response_code(403);
    exit('Access denied');
}

return [
    'admin_user' => 'admin',
    // Default password: Promind2026! (Bisa diubah langsung di dalam portal)
    'admin_hash' => '$2y$12$J9Yl804PPrYmx950wOwCDOeGFg8ts7pw.aepmBvvQdWLYblR6XLsS',
    'session_name' => 'promind_portal_sess',
];
