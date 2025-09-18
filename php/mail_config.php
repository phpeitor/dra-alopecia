<?php
require_once __DIR__ . '/../vendor/autoload.php';

$root = dirname(__DIR__);
if (file_exists($root.'/.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable($root);
    $dotenv->safeLoad(); 
}

function envv($key, $default = null) {
    $v = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    return $v !== false && $v !== null ? $v : $default;
}

return [
  'host'       => envv('MAIL_HOST', 'metadatape.com'),
  'port'       => (int) envv('MAIL_PORT', 465),
  'secure'     => envv('MAIL_SECURE', 'ssl'),
  'username'   => envv('MAIL_USERNAME'),
  'password'   => envv('MAIL_PASSWORD'),
  'from_email' => envv('MAIL_FROM_EMAIL'),
  'from_name'  => envv('MAIL_FROM_NAME', 'Alopecia Corp.'),
  'reply_to'   => ['email' => envv('MAIL_REPLY_TO'), 'name' => envv('MAIL_REPLY_NAME', 'Soporte')],
  'bcc_admin'  => envv('MAIL_BCC_ADMIN'),
];
?>