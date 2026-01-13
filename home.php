<?php
  declare(strict_types=1);
  session_start();

  if (isset($_GET['logout'])) {
    unset($_SESSION['citas_ok']);
    header('Location: '.$_SERVER['PHP_SELF']);
    exit;
  }

  require_once __DIR__ . '/vendor/autoload.php';
  if (class_exists(\Dotenv\Dotenv::class)) {
    \Dotenv\Dotenv::createImmutable(__DIR__)->safeLoad();
  }

  $TOKEN = $_ENV['CITAS_TOKEN'] ?? getenv('CITAS_TOKEN') ?: null;
  $TTL_MIN = (int)($_ENV['CITAS_TOKEN_TTL_MIN'] ?? getenv('CITAS_TOKEN_TTL_MIN') ?: 0); 

  if (!$TOKEN) {
    http_response_code(500);
    echo "Config faltante: define CITAS_TOKEN en .env o entorno.";
    exit;
  }

  if (isset($_GET['logout'])) {
    session_unset();
    session_destroy();
    header('Location: '.$_SERVER['PHP_SELF']);
    exit;
  }

  $now = time();
  if (!empty($_SESSION['citas_ok'])) {
    $until = (int)($_SESSION['citas_until'] ?? 0);
    if ($TTL_MIN > 0 && $until > 0 && $now > $until) {
      session_unset();
      session_destroy();
    } else {
      if ($TTL_MIN > 0) {
        $_SESSION['citas_until'] = $now + ($TTL_MIN * 60);
      }
    }
  }

  if (empty($_SESSION['citas_ok'])) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
      $input = $_POST['access_token'] ?? '';
      if (hash_equals($TOKEN, $input)) {
        session_regenerate_id(true);
        $_SESSION['citas_ok'] = true;
        $_SESSION['citas_until'] = ($TTL_MIN > 0) ? $now + ($TTL_MIN * 60) : 0;
        header('Location: '.$_SERVER['PHP_SELF']);
        exit;
      }
      $error = 'Token incorrecto';
    }
?>
  <!DOCTYPE html>
  <html lang="es"><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Acceso | Alopecia Corp.</title>
    <link rel="icon" type="image/svg+xml" href="./img/favicon-2.svg" />
    <link rel="stylesheet" href="./css/app.css"/>
    <link rel="stylesheet" type="text/css" href="./css/view-patients.css"/>
    <link rel="stylesheet" href=./css/search_health_workers.css>
    <link rel="stylesheet" type="text/css" href="./css/health_workers_cards.css"/>
    <link rel="stylesheet" href="./css/navbar.css"/>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/alertifyjs@1.14.0/build/css/alertify.min.css"/>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/alertifyjs@1.14.0/build/css/themes/default.min.css"/>
    <style>
      :root { --brand:#496caf; --bg:#f7f9fc; --card:#fff; --muted:#8a94a6; }
      body{margin:0;background:var(--bg);font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;}
      .wrap{min-height:100dvh;display:grid;place-items:center;padding:24px;}
      .card{background:var(--card);border:1px solid #e4e8f2;border-radius:14px;box-shadow:0 6px 16px rgba(0,0,0,.06);width:100%;max-width:380px;padding:22px}
      h1{margin:0 0 8px;color:#1f2d4d;font-size:20px}
      p{margin:0 0 14px;color:var(--muted);font-size:14px}
      label{display:block;margin:10px 0 6px;color:#405f8d;font-size:12px;font-weight:600}
      input{width:100%;padding:10px 12px;border:1px solid #c9d2e3;border-radius:10px;font-size:14px}
      .row{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}
      .btn{appearance:none;border:1px solid var(--brand);background:var(--brand);color:#fff;border-radius:10px;padding:10px 14px;cursor:pointer}
      .muted{color:#c92a2a;font-size:12px;margin-top:6px}
    </style>
  </head><body>
    <div class="wrap">
      <form class="card" method="post" autocomplete="off">
        <h1>Acceso restringido</h1>
        <p>Ingresa el token para ver el listado de citas.</p>
        <label for="access_token">Token</label>
        <input id="access_token" name="access_token" type="password" required autofocus>
        <?php if (!empty($error)) { echo '<div class="muted">'.$error.'</div>'; } ?>
        <div class="row">
          <button class="btn" type="submit">Ingresar</button>
        </div>
      </form>
    </div>
  </body></html>
  <?php
  exit;
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Citas | Alopecia Corp.</title>
  <link rel="icon" type="image/svg+xml" href="./img/favicon-2.svg" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable@14.3.0/dist/handsontable.full.min.css">
  <link rel="stylesheet" href="./css/app.css">
  <link rel="stylesheet" type="text/css" href="./css/view-patients.css">
  <link rel="stylesheet" href=./css/search_health_workers.css>
  <link rel="stylesheet" type="text/css" href="./css/health_workers_cards.css">
  <link rel="stylesheet" href="./css/navbar.css">
  <link rel="stylesheet" href="./css/footer.css">
</head>
<body>
  <section class="pt-4 mb-4 m-auto medium-container">
      <div id="health-workers" class="search-health">
          <div class="px-2 py-4 pb-4 search-health-worker__container">
              <h5 style="color:#405f8d;margin: 0 0 12px;">Listado de Citas</h5>
                <div class="toolbar">
                  <div class="actions">
                    <div class="field">
                      <label for="from">Desde</label>
                      <input class="w-100 ps-2" type="date" id="from" required />
                    </div>
                    <div class="field">
                      <label for="to">Hasta</label>
                      <input class="w-100 ps-2" type="date" id="to" required />
                    </div>
                    <div class="field field--actions">
                      <div class="btn-group">
                        <button class="btn" id="btn-load">Buscar</button>
                        <button class="btn secondary" id="btn-export">Exportar CSV</button>
                        <?php if (!empty($_SESSION['citas_ok'])): ?>
                          <a href="?logout=1">✖️</a>
                        <?php endif; ?>
                      </div>
                    </div>
                  </div>
                  <div class="mb-md-2 pe-md-2">
                    <label>Sede</label>
                    <select class="w-100 ps-2" id="sede">
                      <option value="">Todas</option>
                      <option value="Lima">Lima</option>
                      <option value="Arequipa">Arequipa</option>
                    </select>
                  </div>
                  <div class="mb-md-2 pe-md-2">
                    <label>Tipo</label>
                    <select class="w-100 ps-2" id="tipo">
                      <option value="">Todos</option>
                      <option value="presencial">Presencial</option>
                      <option value="virtual">Virtual</option>
                    </select>
                  </div>
                  <div class="mb-md-2 pe-md-2">
                    <label>Status</label>
                    <select class="w-100 ps-2" id="status">
                      <option value="">Todos</option>
                      <option value="PENDIENTE">PENDIENTE</option>
                      <option value="CONFIRMADO">CONFIRMADO</option>
                      <option value="CANCELADO">CANCELADO</option>
                      <option value="COMPLETADO">COMPLETADO</option>
                    </select>
                  </div>
                  <div class="mb-md-2 pe-md-2">
                    <label>Profesional</label>
                    <input class="form-control" type="text" id="profesional" placeholder="Ej. Dra. Belén" />
                  </div>
              </div>
          </div>
      </div>
  </section>
  
  <section id="public-profile-cards" class="m-auto medium-container">
     <div id="grid"></div>
  </section>

  <footer style="background-color: rgba(73, 108, 175, .05)">
      <div class="text-center text-sm-start ms-sm-3 pb-2">
          <span class="footer__copyright"><span id="now_year"></span> © Copyright Alopecia Corp. Todos los derechos reservados.</span>
      </div>
  </footer>
  
  <script src="./js/public-profile-cards.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/handsontable@14.3.0/dist/handsontable.full.min.js"></script>
  <script src="./js/citas.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/alertifyjs@1.14.0/build/alertify.min.js"></script>
</body>
</html>