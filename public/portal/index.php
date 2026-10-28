<?php
define('PROMIND_PORTAL', true);

// Configure session
$config = require __DIR__ . '/config.php';
session_name($config['session_name']);
session_start();

// Locate data file
$dataFile = null;
$possiblePaths = [
    __DIR__ . '/../api/site-content.json',
    __DIR__ . '/../../public/api/site-content.json',
    __DIR__ . '/api/site-content.json',
];
foreach ($possiblePaths as $p) {
    if (file_exists($p)) {
        $dataFile = realpath($p);
        break;
    }
}
if (!$dataFile && file_exists(__DIR__ . '/../api')) {
    $dataFile = __DIR__ . '/../api/site-content.json';
}

function load_data($path) {
    if (!$path || !file_exists($path)) return [];
    $raw = file_get_contents($path);
    return json_decode($raw, true) ?: [];
}

function save_data($path, $data) {
    if (!$path) return false;
    // Create backup
    if (file_exists($path)) {
        @copy($path, $path . '.bak');
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    return file_put_contents($path, $json, LOCK_EX) !== false;
}

// Generate CSRF token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$error = '';
$success = '';

// Handle Logout
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
    }
    session_destroy();
    header("Location: index.php");
    exit;
}

// Handle Login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $user = trim($_POST['username'] ?? '');
    $pass = $_POST['password'] ?? '';
    
    if ($user === $config['admin_user'] && password_verify($pass, $config['admin_hash'])) {
        $_SESSION['logged_in'] = true;
        $_SESSION['admin_user'] = $user;
        header("Location: index.php");
        exit;
    } else {
        $error = 'Username atau kata sandi tidak valid.';
    }
}

// Authentication Check
$isLoggedIn = !empty($_SESSION['logged_in']);

// If logged in, handle admin actions
if ($isLoggedIn && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'] ?? '')) {
        $error = 'Token keamanan (CSRF) tidak valid.';
    } else {
        $action = $_POST['action'] ?? '';
        $data = load_data($dataFile);

        // 1. Change Password
        if ($action === 'change_password') {
            $currentPass = $_POST['current_password'] ?? '';
            $newPass = $_POST['new_password'] ?? '';
            $confirmPass = $_POST['confirm_password'] ?? '';

            if (!password_verify($currentPass, $config['admin_hash'])) {
                $error = 'Kata sandi saat ini tidak cocok.';
            } elseif (strlen($newPass) < 8) {
                $error = 'Kata sandi baru minimal 8 karakter.';
            } elseif ($newPass !== $confirmPass) {
                $error = 'Konfirmasi kata sandi baru tidak sama.';
            } else {
                $newHash = password_hash($newPass, PASSWORD_BCRYPT);
                $configContent = "<?php\n// PROMIND Portal Configuration\nif (!defined('PROMIND_PORTAL')) { http_response_code(403); exit('Access denied'); }\nreturn [\n    'admin_user' => " . var_export($config['admin_user'], true) . ",\n    'admin_hash' => " . var_export($newHash, true) . ",\n    'session_name' => " . var_export($config['session_name'], true) . ",\n];\n";
                file_put_contents(__DIR__ . '/config.php', $configContent);
                $config['admin_hash'] = $newHash;
                $success = 'Kata sandi berhasil diperbarui!';
            }
        }

        // 2. Save Company Info & Maintenance
        if ($action === 'save_company') {
            $isMaint = !empty($_POST['is_maintenance']);
            $data['companyInfo']['hq'] = trim($_POST['hq'] ?? '');
            $data['companyInfo']['email'] = trim($_POST['email'] ?? '');
            $data['companyInfo']['phone'] = trim($_POST['phone'] ?? '');
            $data['companyInfo']['whatsapp'] = trim($_POST['whatsapp'] ?? '');
            $data['companyInfo']['isMaintenance'] = $isMaint;
            $data['companyInfo']['maintenanceMessage'] = trim($_POST['maintenance_message'] ?? '');
            
            $data['maintenance']['isMaintenance'] = $isMaint;
            $data['maintenance']['message'] = trim($_POST['maintenance_message'] ?? '');
            $data['maintenance']['estimatedDuration'] = trim($_POST['maintenance_duration'] ?? '');

            if (save_data($dataFile, $data)) {
                $success = 'Informasi perusahaan dan status pemeliharaan berhasil disimpan!';
            } else {
                $error = 'Gagal menyimpan data ke file JSON.';
            }
        }

        // 3. Save Career (Create or Edit)
        if ($action === 'save_career') {
            $careerId = trim($_POST['career_id'] ?? '');
            $title = trim($_POST['title'] ?? '');
            $slug = trim($_POST['slug'] ?? '');
            if (!$slug) {
                $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title)));
            }

            $respArr = array_values(array_filter(array_map('trim', explode("\n", $_POST['responsibilities'] ?? ''))));
            $qualArr = array_values(array_filter(array_map('trim', explode("\n", $_POST['qualifications'] ?? ''))));
            $beneArr = array_values(array_filter(array_map('trim', explode("\n", $_POST['benefits'] ?? ''))));

            $careerItem = [
                'id' => $careerId ?: ('job-' . time()),
                'slug' => $slug,
                'title' => $title,
                'dept' => trim($_POST['dept'] ?? 'Building Operations'),
                'type' => trim($_POST['type'] ?? 'Full-Time'),
                'exp' => trim($_POST['exp'] ?? ''),
                'location' => trim($_POST['location'] ?? 'Jakarta'),
                'email' => trim($_POST['email'] ?? 'recruitment@promind.co.id'),
                'desc' => trim($_POST['desc'] ?? ''),
                'responsibilities' => $respArr,
                'qualifications' => $qualArr,
                'benefits' => $beneArr,
                'published_at' => trim($_POST['published_at'] ?? date('c')),
                'created_at' => trim($_POST['created_at'] ?? date('c')),
            ];

            if (!isset($data['careers'])) $data['careers'] = [];
            $found = false;
            foreach ($data['careers'] as $idx => $c) {
                if (($careerId && $c['id'] === $careerId) || (!$careerId && $c['slug'] === $slug)) {
                    $careerItem['created_at'] = $c['created_at'] ?? date('c');
                    $data['careers'][$idx] = $careerItem;
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $data['careers'][] = $careerItem;
            }

            if (save_data($dataFile, $data)) {
                $success = 'Lowongan posisi "' . htmlspecialchars($title) . '" berhasil disimpan!';
            } else {
                $error = 'Gagal menyimpan lowongan pekerjaan.';
            }
        }

        // 4. Delete Career
        if ($action === 'delete_career') {
            $careerId = trim($_POST['career_id'] ?? '');
            if (!empty($data['careers'])) {
                $data['careers'] = array_values(array_filter($data['careers'], function($c) use ($careerId) {
                    return $c['id'] !== $careerId;
                }));
                if (save_data($dataFile, $data)) {
                    $success = 'Lowongan berhasil dihapus.';
                } else {
                    $error = 'Gagal memperbarui data lowongan.';
                }
            }
        }
    }
}

// Reload current data
$data = load_data($dataFile);
$careers = $data['careers'] ?? [];
$company = $data['companyInfo'] ?? [];
$maintenance = $data['maintenance'] ?? [];
$services = $data['services'] ?? [];
$activeTab = $_GET['tab'] ?? 'careers';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PROMIND Operations Portal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-stone: #f6f5f1;
            --surface: #ffffff;
            --navy: #172b42;
            --blue: #2b5caf;
            --blue-hover: #194586;
            --text-body: #526374;
            --border: #d8dfe5;
            --border-light: #e6ebef;
            --radius: 6px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'DM Sans', sans-serif;
            background: var(--bg-stone);
            color: var(--navy);
            line-height: 1.6;
            min-height: 100vh;
        }
        h1, h2, h3, h4, .btn, .nav-tab, .label-header {
            font-family: 'Manrope', sans-serif;
        }
        .header {
            background: #ffffff;
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 50;
        }
        .header-inner {
            max-width: 1240px;
            margin: 0 auto;
            padding: 0 24px;
            height: 76px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .brand-link {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: var(--navy);
        }
        .brand-logo-text {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.05em;
            color: var(--navy);
        }
        .brand-pill {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            background: #eef3f8;
            color: var(--blue);
            padding: 4px 10px;
            border-radius: 4px;
        }
        .header-links {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .header-link {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-body);
            text-decoration: none;
            transition: color 0.15s;
        }
        .header-link:hover { color: var(--blue); }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 700;
            border-radius: var(--radius);
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
        }
        .btn-primary { background: var(--blue); color: #fff; }
        .btn-primary:hover { background: var(--blue-hover); }
        .btn-outline { background: #fff; border: 1px solid var(--border); color: var(--navy); }
        .btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; }
        .btn-danger { background: #ef4444; color: #fff; }
        .btn-danger:hover { background: #dc2626; }
        .btn-sm { padding: 6px 12px; font-size: 12px; }

        .container {
            max-width: 1240px;
            margin: 0 auto;
            padding: 36px 24px 60px;
        }
        .alert {
            padding: 14px 18px;
            border-radius: var(--radius);
            font-size: 14px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .alert-success { background: #e6f4ea; border: 1px solid #b7dfc3; color: #137333; }
        .alert-error { background: #fce8e6; border: 1px solid #fad2cf; color: #c5221f; }

        /* Login Layout */
        .login-wrap {
            min-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .login-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            width: 100%;
            max-width: 440px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 700;
            color: var(--navy);
            margin-bottom: 6px;
        }
        .form-control {
            width: 100%;
            padding: 10px 14px;
            font-family: inherit;
            font-size: 14px;
            color: var(--navy);
            background: #fff;
            border: 1px solid var(--border);
            border-radius: var(--radius);
            outline: none;
            transition: border 0.15s;
        }
        .form-control:focus {
            border-color: var(--blue);
            box-shadow: 0 0 0 2px rgba(43, 92, 175, 0.12);
        }
        textarea.form-control { resize: vertical; min-height: 90px; }
        .form-hint { font-size: 12px; color: var(--text-body); margin-top: 5px; }

        /* Tabs & Dashboard */
        .dashboard-nav {
            display: flex;
            gap: 8px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 30px;
            overflow-x: auto;
        }
        .nav-tab {
            padding: 12px 18px;
            font-size: 14px;
            font-weight: 700;
            color: var(--text-body);
            text-decoration: none;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
            white-space: nowrap;
        }
        .nav-tab:hover { color: var(--navy); }
        .nav-tab.active {
            color: var(--blue);
            border-bottom-color: var(--blue);
        }

        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 28px;
            margin-bottom: 24px;
        }
        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 22px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border-light);
        }
        .card-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--navy);
        }
        .table-wrap {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }
        th, td {
            padding: 14px 16px;
            border-bottom: 1px solid var(--border-light);
            font-size: 14px;
        }
        th {
            font-family: 'Manrope', sans-serif;
            font-weight: 700;
            color: var(--navy);
            background: #fafbfc;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
        }
        tr:last-child td { border-bottom: none; }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 700;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .badge-active { background: #e6f4ea; color: #137333; }
        .badge-draft { background: #f1f3f4; color: #5f6368; }
        .grid-2 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }
    </style>
</head>
<body>

<?php if (!$isLoggedIn): ?>
    <!-- LOGIN SCREEN -->
    <div class="login-wrap">
        <div class="login-card">
            <div style="margin-bottom: 28px; text-align: center;">
                <div class="brand-logo-text" style="font-size: 24px;">PROMIND</div>
                <div style="font-size: 13px; color: var(--text-body); margin-top: 6px;">Integrated Property Management Operations Portal</div>
            </div>

            <?php if ($error): ?>
                <div class="alert alert-error"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>

            <form method="POST" action="index.php">
                <input type="hidden" name="login" value="1">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" name="username" class="form-control" placeholder="admin" required autofocus>
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" name="password" class="form-control" placeholder="••••••••••••" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">Masuk ke Portal</button>
            </form>

            <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #8a99a8;">
                PT Properti Manajemen Inovasi Indonesia &copy; <?= date('Y') ?>
            </div>
        </div>
    </div>
<?php else: ?>
    <!-- AUTHENTICATED DASHBOARD -->
    <header class="header">
        <div class="header-inner">
            <a href="index.php" class="brand-link">
                <span class="brand-logo-text">PROMIND</span>
                <span class="brand-pill">Operations Portal</span>
            </a>
            <div class="header-links">
                <a href="https://promind.co.id" target="_blank" class="header-link">Lihat Website &nearr;</a>
                <a href="https://webmail.promind.co.id" target="_blank" class="header-link">Webmail &nearr;</a>
                <span style="color: var(--border);">|</span>
                <span style="font-size: 13px; font-weight: 600; color: var(--navy);"><?= htmlspecialchars($_SESSION['admin_user']) ?></span>
                <a href="index.php?action=logout" class="btn btn-outline btn-sm">Keluar</a>
            </div>
        </div>
    </header>

    <main class="container">
        <?php if ($success): ?>
            <div class="alert alert-success"><?= htmlspecialchars($success) ?></div>
        <?php endif; ?>
        <?php if ($error): ?>
            <div class="alert alert-error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <!-- NAV TABS -->
        <nav class="dashboard-nav">
            <a href="index.php?tab=careers" class="nav-tab <?= $activeTab === 'careers' ? 'active' : '' ?>">Lowongan Karir (<?= count($careers) ?>)</a>
            <a href="index.php?tab=company" class="nav-tab <?= $activeTab === 'company' ? 'active' : '' ?>">Info Kantor & Kontak</a>
            <a href="index.php?tab=security" class="nav-tab <?= $activeTab === 'security' ? 'active' : '' ?>">Ganti Password</a>
        </nav>

        <?php if ($activeTab === 'careers'): ?>
            <?php 
                $editId = $_GET['edit'] ?? null;
                $editingCareer = null;
                if ($editId) {
                    foreach ($careers as $c) {
                        if ($c['id'] === $editId) {
                            $editingCareer = $c;
                            break;
                        }
                    }
                }
            ?>

            <?php if (isset($_GET['new']) || $editingCareer): ?>
                <!-- FORM ADD / EDIT CAREER -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title"><?= $editingCareer ? 'Edit Lowongan Pekerjaan' : 'Tambah Lowongan Pekerjaan Baru' ?></h2>
                        <a href="index.php?tab=careers" class="btn btn-outline btn-sm">&larr; Kembali ke Daftar</a>
                    </div>

                    <form method="POST" action="index.php?tab=careers">
                        <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                        <input type="hidden" name="action" value="save_career">
                        <input type="hidden" name="career_id" value="<?= htmlspecialchars($editingCareer['id'] ?? '') ?>">
                        <input type="hidden" name="created_at" value="<?= htmlspecialchars($editingCareer['created_at'] ?? '') ?>">

                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label">Judul Posisi *</label>
                                <input type="text" name="title" class="form-control" value="<?= htmlspecialchars($editingCareer['title'] ?? '') ?>" placeholder="Misal: Building Manager" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Slug URL (Otomatis jika dikosongkan)</label>
                                <input type="text" name="slug" class="form-control" value="<?= htmlspecialchars($editingCareer['slug'] ?? '') ?>" placeholder="misal: building-manager">
                            </div>
                        </div>

                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label">Departemen</label>
                                <input type="text" name="dept" class="form-control" value="<?= htmlspecialchars($editingCareer['dept'] ?? 'Building Operations') ?>" placeholder="Building Operations / Engineering / HSE">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Tipe Pekerjaan</label>
                                <input type="text" name="type" class="form-control" value="<?= htmlspecialchars($editingCareer['type'] ?? 'Full-Time') ?>" placeholder="Full-Time / Kontrak">
                            </div>
                        </div>

                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label">Lokasi Penempatan</label>
                                <input type="text" name="location" class="form-control" value="<?= htmlspecialchars($editingCareer['location'] ?? 'Jakarta Selatan (On-site Tower)') ?>">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Pengalaman Minimal</label>
                                <input type="text" name="exp" class="form-control" value="<?= htmlspecialchars($editingCareer['exp'] ?? 'Pengalaman min. 3 tahun') ?>">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Email Penerimaan CV</label>
                            <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($editingCareer['email'] ?? 'recruitment@promind.co.id') ?>">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Deskripsi Pekerjaan Singkat</label>
                            <textarea name="desc" class="form-control"><?= htmlspecialchars($editingCareer['desc'] ?? '') ?></textarea>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Tanggung Jawab Utama (1 Poin Per Baris)</label>
                            <textarea name="responsibilities" class="form-control" style="min-height: 120px;"><?= htmlspecialchars(implode("\n", $editingCareer['responsibilities'] ?? [])) ?></textarea>
                            <div class="form-hint">Pisahkan tiap tanggung jawab dengan baris baru (Enter).</div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Kualifikasi Persyaratan (1 Poin Per Baris)</label>
                            <textarea name="qualifications" class="form-control" style="min-height: 120px;"><?= htmlspecialchars(implode("\n", $editingCareer['qualifications'] ?? [])) ?></textarea>
                            <div class="form-hint">Pisahkan tiap persyaratan kualifikasi dengan baris baru (Enter).</div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Benefit & Fasilitas (1 Poin Per Baris)</label>
                            <textarea name="benefits" class="form-control" style="min-height: 90px;"><?= htmlspecialchars(implode("\n", $editingCareer['benefits'] ?? [])) ?></textarea>
                        </div>

                        <button type="submit" class="btn btn-primary" style="padding: 12px 24px;">Simpan Lowongan</button>
                    </form>
                </div>
            <?php else: ?>
                <!-- CAREER LIST TABLE -->
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Daftar Lowongan Karir Aktif</h2>
                            <p style="font-size: 13px; color: var(--text-body); margin-top: 4px;">Setiap perubahan yang Anda simpan akan langsung diperbarui di website promind.co.id.</p>
                        </div>
                        <a href="index.php?tab=careers&new=1" class="btn btn-primary">+ Tambah Lowongan</a>
                    </div>

                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Posisi Pekerjaan</th>
                                    <th>Departemen</th>
                                    <th>Lokasi</th>
                                    <th>Tipe</th>
                                    <th>Email Lamaran</th>
                                    <th style="text-align: right;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($careers)): ?>
                                    <tr>
                                        <td colspan="6" style="text-align: center; padding: 32px; color: var(--text-body);">Belum ada lowongan pekerjaan. Klik tombol "+ Tambah Lowongan" di atas untuk membuat baru.</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($careers as $job): ?>
                                        <tr>
                                            <td>
                                                <div style="font-weight: 700; color: var(--navy);"><?= htmlspecialchars($job['title']) ?></div>
                                                <div style="font-size: 12px; color: #8a99a8;">/careers/<?= htmlspecialchars($job['slug']) ?></div>
                                            </td>
                                            <td><?= htmlspecialchars($job['dept'] ?? '-') ?></td>
                                            <td><?= htmlspecialchars($job['location'] ?? '-') ?></td>
                                            <td><span class="badge badge-active"><?= htmlspecialchars($job['type'] ?? 'Full-Time') ?></span></td>
                                            <td><?= htmlspecialchars($job['email'] ?? '-') ?></td>
                                            <td style="text-align: right; white-space: nowrap;">
                                                <a href="index.php?tab=careers&edit=<?= urlencode($job['id']) ?>" class="btn btn-outline btn-sm">Edit</a>
                                                <form method="POST" action="index.php?tab=careers" style="display: inline-block;" onsubmit="return confirm('Hapus lowongan <?= htmlspecialchars($job['title']) ?>?');">
                                                    <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                                                    <input type="hidden" name="action" value="delete_career">
                                                    <input type="hidden" name="career_id" value="<?= htmlspecialchars($job['id']) ?>">
                                                    <button type="submit" class="btn btn-danger btn-sm">Hapus</button>
                                                </form>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            <?php endif; ?>

        <?php elseif ($activeTab === 'company'): ?>
            <!-- COMPANY & CONTACT SETTINGS -->
            <div class="card">
                <div class="card-header">
                    <div>
                        <h2 class="card-title">Informasi Kontak & Operasional</h2>
                        <p style="font-size: 13px; color: var(--text-body); margin-top: 4px;">Informasi ini ditampilkan di footer, halaman kontak, dan profil perusahaan PROMIND.</p>
                    </div>
                </div>

                <form method="POST" action="index.php?tab=company">
                    <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                    <input type="hidden" name="action" value="save_company">

                    <div class="form-group">
                        <label class="form-label">Alamat Kantor Pusat (HQ)</label>
                        <textarea name="hq" class="form-control" style="min-height: 80px;"><?= htmlspecialchars($company['hq'] ?? '') ?></textarea>
                    </div>

                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Email Resmi Perusahaan</label>
                            <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($company['email'] ?? 'corporate@promind.co.id') ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nomor Telepon Kantor</label>
                            <input type="text" name="phone" class="form-control" value="<?= htmlspecialchars($company['phone'] ?? '+62 21 5289 8800') ?>">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Nomor WhatsApp Operasional</label>
                        <input type="text" name="whatsapp" class="form-control" value="<?= htmlspecialchars($company['whatsapp'] ?? '+62 811 1234 5678') ?>">
                    </div>

                    <hr style="border: 0; border-top: 1px solid var(--border-light); margin: 30px 0 24px;">

                    <h3 style="font-size: 16px; margin-bottom: 16px; color: var(--navy);">Mode Pemeliharaan (Maintenance Mode)</h3>
                    <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="maint_check" name="is_maintenance" value="1" <?= !empty($company['isMaintenance']) ? 'checked' : '' ?> style="width: 18px; height: 18px; accent-color: var(--blue);">
                        <label for="maint_check" style="font-size: 14px; font-weight: 700; cursor: pointer;">Aktifkan Layar Pemeliharaan Publik (Website akan menampilkan halaman maintenance)</label>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Pesan Pemeliharaan</label>
                        <textarea name="maintenance_message" class="form-control"><?= htmlspecialchars($company['maintenanceMessage'] ?? $maintenance['message'] ?? '') ?></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Estimasi Durasi Pemeliharaan</label>
                        <input type="text" name="maintenance_duration" class="form-control" value="<?= htmlspecialchars($maintenance['estimatedDuration'] ?? 'Estimasi selesai dalam 1-2 jam') ?>">
                    </div>

                    <button type="submit" class="btn btn-primary" style="padding: 12px 24px;">Simpan Perubahan Kontak</button>
                </form>
            </div>

        <?php elseif ($activeTab === 'security'): ?>
            <!-- CHANGE PASSWORD -->
            <div class="card" style="max-width: 540px;">
                <div class="card-header">
                    <h2 class="card-title">Ganti Kata Sandi Portal</h2>
                </div>

                <form method="POST" action="index.php?tab=security">
                    <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                    <input type="hidden" name="action" value="change_password">

                    <div class="form-group">
                        <label class="form-label">Kata Sandi Saat Ini *</label>
                        <input type="password" name="current_password" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Kata Sandi Baru (Min. 8 Karakter) *</label>
                        <input type="password" name="new_password" class="form-control" required minlength="8">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Konfirmasi Kata Sandi Baru *</label>
                        <input type="password" name="confirm_password" class="form-control" required minlength="8">
                    </div>

                    <button type="submit" class="btn btn-primary" style="padding: 12px 24px;">Perbarui Kata Sandi</button>
                </form>
            </div>
        <?php endif; ?>
    </main>
<?php endif; ?>

</body>
</html>
