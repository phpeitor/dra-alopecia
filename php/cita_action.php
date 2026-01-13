<?php
declare(strict_types=1);
header('Content-Type: text/html; charset=UTF-8');

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/cita.php';

$CFG = require __DIR__ . '/mail_config.php';

function renderPage(string $msg, bool $ok, int $autoCloseSec = 5): void {
  $data = [
    'msg' => $msg,
    'ok'  => $ok,
    'sec' => max(0, $autoCloseSec),
  ];

  extract($data);
  require __DIR__ . '/cita_result.php';
  exit;
}

$id     = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$action = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : '';
$exp    = isset($_GET['exp']) ? (int)$_GET['exp'] : 0;
$sig    = $_GET['sig'] ?? '';

$secret = $CFG['action_secret'] ?? '';
if ($id <= 0 || !$action || !$exp || !$sig || !$secret) {
  renderPage("Enlace inválido.", false);
}

if (time() > $exp) {
  renderPage("El enlace ha expirado.", false);
}

$payload = $id.'|'.$action.'|'.$exp;
$calc = hash_hmac('sha256', $payload, $secret);
if (!hash_equals($calc, $sig)) {
  renderPage("Firma inválida.", false);
}

try {
  $cita = new Cita();

  if ($action === 'anular') {
    $ok = $cita->anularSiPendiente($id);
    if ($ok) {
      renderPage("La cita <span class='accent'>#$id</span> fue <strong>ANULADA</strong> correctamente.", true);
    } else {
      $status = $cita->getStatusById($id);
      $statusTxt = $status ? htmlspecialchars($status, ENT_QUOTES, 'UTF-8') : 'desconocido';
      renderPage("Esta cita ya fue gestionada previamente (estado actual: <strong>$statusTxt</strong>). Si necesitas ayuda, responde el correo de confirmación o contáctanos por nuestros canales.", false);
    }
  } elseif ($action === 'reprogramar') {
    $ok = $cita->reprogramarSiPendiente($id);
    if ($ok) {
      renderPage("La cita <span class='accent'>#$id</span> fue marcada para <strong>REPROGRAMAR</strong>. Nuestro equipo se pondrá en contacto contigo.", true);
    } else {
      $status = $cita->getStatusById($id);
      $statusTxt = $status ? htmlspecialchars($status, ENT_QUOTES, 'UTF-8') : 'desconocido';
      renderPage("Esta cita ya fue gestionada previamente (estado actual: <strong>$statusTxt</strong>). Si necesitas un cambio, por favor responde al correo de confirmación.", false);
    }
  } else {
    renderPage("Acción no soportada.", false);
  }
} catch (Throwable $e) {
  renderPage("Error del servidor: ".htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8'), false);
}