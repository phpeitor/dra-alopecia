<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Citas | Alopecia Corp.</title>
  <link rel="icon" href="../img/favicon-2.svg">
  <link rel="stylesheet" href="../css/cita_result.css">
</head>
<body data-ok="<?= $ok ? '1' : '0' ?>" data-sec="<?= $sec ?>">
  <div class="card">
    <div class="msg"><?= $msg ?></div>
    <div class="muted">
      Esta ventana se cerrará en <span id="cnt"><?= $sec ?></span> s.
    </div>
    <div class="row">
      <button id="close-now" class="btn secondary">Cerrar ahora</button>
    </div>
  </div>

  <script src="../js/cita_result.js"></script>
</body>
</html>