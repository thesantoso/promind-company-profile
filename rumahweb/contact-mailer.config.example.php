<?php
// Salin menjadi contact-mailer.config.php DI SERVER (jangan commit versi aslinya).
// hmac_key harus SAMA dengan secret Worker CONTACT_HMAC_KEY (minimal 32 karakter acak).
return [
    'hmac_key' => 'GANTI-DENGAN-KUNCI-ACAK-MINIMAL-32-KARAKTER',
    'to'       => 'corporate@promind.co.id',
    'from'     => 'no-reply@promind.co.id',
];
