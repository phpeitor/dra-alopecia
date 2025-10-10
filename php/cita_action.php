<?php
declare(strict_types=1);
header('Content-Type: text/html; charset=UTF-8');

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/cita.php';

$CFG = require __DIR__ . '/mail_config.php';

function renderPage(string $msg, bool $ok, int $autoCloseSec = 5): void {
  $color = $ok ? '#0b8a47' : '#c92a2a';
  $sec   = max(0, (int)$autoCloseSec);

  echo "<!doctype html><html lang='es'><head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width,initial-scale=1'>
    <title>Citas | Alopecia Corp.</title>
    <link rel='icon' type='image/svg+xml' href='../img/favicon-2.svg' />
    <style>
      :root { --ok:$color; --txt:#1f2d4d; --muted:#8a94a6; --bd:#e4e8f2; --bg:#f7f9fc; }
      html,body{height:100%}
      body{margin:0;background:var(--bg);font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:32px;display:grid;place-items:center}
      .card{max-width:640px;width:100%;margin:auto;border:1px solid var(--bd);border-radius:14px;padding:22px 22px 16px;box-shadow:0 6px 16px rgba(0,0,0,.06);background:#fff}
      .msg{color:var(--txt);font-size:16px;line-height:1.45}
      .accent{color:var(--ok);font-weight:600}
      .muted{color:var(--muted);font-size:13px;margin-top:10px}
      .row{margin-top:14px;display:flex;gap:8px;justify-content:flex-end;align-items:center}
      .btn{appearance:none;border:1px solid #496caf;background:#496caf;color:#fff;border-radius:10px;padding:10px 14px;cursor:pointer;font-size:14px}
      .btn.secondary{background:#fff;color:#496caf}
      .count{font-variant-numeric:tabular-nums}
    </style>
  </head><body>
    <div class='card'>
      <div class='msg'>$msg</div>
      <div class='muted'>Esta ventana se cerrará automáticamente en <span id='cnt' class='count'>$sec</span> s.</div>
      <div class='row'>
        <button class='btn secondary' id='close-now' type='button'>Cerrar ahora</button>
      </div>
    </div>
    <script>
      (function(){
        var s = $sec;
        var el = document.getElementById('cnt');
        var iv = setInterval(function(){
          if (!el) return;
          s = Math.max(0, s-1);
          el.textContent = s;
          if (s <= 0) {
            clearInterval(iv);
            try { window.close(); } catch(e){}
          }
        }, 1000);
        document.getElementById('close-now')?.addEventListener('click', function(){
          try { window.close(); } catch(e){}
        });
      })();
    </script>
  </body></html>";
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