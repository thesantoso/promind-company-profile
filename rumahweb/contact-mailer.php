<?php
/**
 * Endpoint pengirim email form kontak PROMIND.
 *
 * Dipanggil HANYA oleh Worker admin (POST JSON) dengan tanda tangan HMAC-SHA256:
 *   X-Timestamp: <detik unix>
 *   X-Signature: hex(hmac_sha256(kunci, "<X-Timestamp>.<badan mentah>"))
 * Tanpa tanda tangan yang valid dan stempel waktu <= 5 menit, permintaan ditolak.
 * Pengaturan ada di contact-mailer.config.php (tidak boleh bisa diunduh, lihat .htaccess).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Menolak CR/LF dan karakter kontrol agar tidak bisa menyisipkan header email. */
function clean_line(mixed $value, int $max): string
{
    if (!is_string($value)) {
        respond(400, ['error' => 'bad_request']);
    }
    $value = trim($value);
    if ($value === '' || mb_strlen($value) > $max || preg_match('/[\x00-\x1F\x7F\x{2028}\x{2029}]/u', $value)) {
        respond(400, ['error' => 'bad_request']);
    }
    return $value;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['error' => 'method_not_allowed']);
}

$configFile = __DIR__ . '/contact-mailer.config.php';
if (!is_file($configFile)) {
    error_log('contact-mailer: config missing');
    respond(500, ['error' => 'not_configured']);
}
/** @var array{hmac_key: string, to: string, from: string} $config */
$config = require $configFile;
if (!is_array($config) || strlen((string) ($config['hmac_key'] ?? '')) < 32) {
    error_log('contact-mailer: hmac_key too short');
    respond(500, ['error' => 'not_configured']);
}

$raw = file_get_contents('php://input', false, null, 0, 20001);
if ($raw === false || strlen($raw) > 20000) {
    respond(413, ['error' => 'too_large']);
}

$timestamp = $_SERVER['HTTP_X_TIMESTAMP'] ?? '';
$signature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';
if (!ctype_digit($timestamp) || abs(time() - (int) $timestamp) > 300) {
    respond(401, ['error' => 'bad_timestamp']);
}
$expected = hash_hmac('sha256', $timestamp . '.' . $raw, (string) $config['hmac_key']);
if (!is_string($signature) || !hash_equals($expected, $signature)) {
    respond(401, ['error' => 'bad_signature']);
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    respond(400, ['error' => 'bad_request']);
}

$name = clean_line($data['name'] ?? null, 80);
$email = clean_line($data['email'] ?? null, 254);
$topic = clean_line($data['topic'] ?? null, 120);
if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    respond(400, ['error' => 'bad_request']);
}
$phone = isset($data['phone']) ? clean_line($data['phone'], 30) : '';
$lang = ($data['lang'] ?? '') === 'en' ? 'en' : 'id';
$ip = isset($data['ip']) ? clean_line($data['ip'], 64) : 'unknown';
$message = $data['message'] ?? null;
if (!is_string($message) || mb_strlen(trim($message)) < 10 || mb_strlen($message) > 4000) {
    respond(400, ['error' => 'bad_request']);
}
$message = str_replace(["\r\n", "\r"], "\n", trim($message));

$subject = mb_encode_mimeheader('[Website PROMIND] ' . $topic . ' - ' . $name, 'UTF-8', 'B', "\r\n");
$body = "Pesan baru dari formulir kontak promind.co.id\n"
    . "----------------------------------------------\n"
    . "Nama    : {$name}\n"
    . "Email   : {$email}\n"
    . 'Telepon : ' . ($phone !== '' ? $phone : '-') . "\n"
    . "Topik   : {$topic}\n"
    . "Bahasa  : {$lang}\n"
    . "IP      : {$ip}\n"
    . "----------------------------------------------\n\n"
    . $message . "\n";

$headers = [
    'From: PROMIND Website <' . $config['from'] . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: promind-contact-mailer',
];
// "-f" memakai alamat domain sendiri agar lolos SPF.
$sent = mail((string) $config['to'], $subject, $body, implode("\r\n", $headers), '-f' . $config['from']);
if (!$sent) {
    error_log('contact-mailer: mail() failed');
    respond(502, ['error' => 'mail_failed']);
}
respond(200, ['ok' => true]);
