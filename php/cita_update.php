<?php
header("Content-Type: application/json; charset=UTF-8");
date_default_timezone_set("America/Lima");

require_once "cita.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'message' => 'Método no permitido']);
  exit;
}

$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$action = isset($_POST['action']) ? strtolower(trim($_POST['action'])) : '';

if ($id <= 0 || !in_array($action, ['confirm','cancel'], true)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Parámetros inválidos']);
  exit;
}

try {
  $cita = new Cita();
  if ($action === 'confirm') {
    $ok = $cita->confirmarSiPendiente($id);
    echo json_encode(['success' => $ok, 'new_status' => $ok ? 'CONFIRMADO' : null]);
  } else { 
    $ok = $cita->anularSiPendiente($id);
    echo json_encode(['success' => $ok, 'new_status' => $ok ? 'ANULADO' : null]);
  }
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Error al actualizar: '.$e->getMessage()]);
}
