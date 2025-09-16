<?php
header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('America/Lima');

require_once "cita.php";

$fecha = $_GET['date'] ?? '';
$prof  = $_GET['profesional'] ?? '';

if (!$fecha || !$prof) {
    http_response_code(400);
    echo json_encode([
        "booked" => [],
        "error"  => "date y profesional son requeridos"
    ]);
    exit;
}

$cita = new Cita();
$booked = $cita->getReservados($fecha, $prof);

echo json_encode([
    "booked" => array_values(array_unique($booked))
], JSON_UNESCAPED_UNICODE);
?>