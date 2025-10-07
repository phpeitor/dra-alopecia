<?php
header("Content-Type: application/json; charset=UTF-8");
date_default_timezone_set("America/Lima");
require_once "cita.php";
require_once "Mailer.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $cita = new Cita();
    $fecha_cita_str = $_POST["fec_cita"] ?? "";
    $fecha_cita_mysql = null;

    if ($fecha_cita_str) {
        if (preg_match('/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/', $fecha_cita_str, $m)) {
            $fecha_cita_mysql = $m[1] . " " . $m[2] . ":00";
        }
    }

    $data = [
        "nombre"           => $_POST["nombre"] ?? "",
        "email"            => $_POST["correo"] ?? "",
        "dni"              => $_POST["dni"] ?? "",
        "telefono"         => $_POST["telefono"] ?? "",
        "fecha_nacimiento" => $_POST["fecha_nac"] ?? "",
        "direccion"        => $_POST["direccion"] ?? "",
        "mensaje"          => $_POST["comentario"] ?? "",
        "fecha_cita"       => $fecha_cita_mysql, 
        "precio"           => str_replace(["S/.", "S/"], "", $_POST["precio"] ?? ""), 
        "fecha_registro"   => date("Y-m-d H:i:s"),
        "profesional"      => $_POST["doctor"] ?? "",
        "status"           => "PENDIENTE",  // 'PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO'
        "sede"             => $_POST["sede"] ?? "",
        "tipo"             => $_POST["tipo"] ?? "Presencial"
    ];

    $ok = $cita->guardar($data);
    $email_sent = false;
    $email_err  = null;
    if ($ok && !empty($data['email'])) {
        $cfg    = require __DIR__ . "/mail_config.php";
        $mailer = new Mailer($cfg);
        $payload = [
          'fecha_cita_nice' => $fecha_cita_mysql,
          'profesional'     => $data['profesional'],
          'precio'          => $data['precio'],
          'dni'             => $data['dni'],
          'telefono'        => $data['telefono'],
        ];
        $email_sent = $mailer->sendConfirmation($data['email'], $data['nombre'] ?: $data['email'], $payload, $cfg['bcc_admin'] ?? null);
        if (!$email_sent) { $email_err = 'No se pudo enviar el correo de confirmación.'; }
    }

    echo json_encode([
        "success"      => $ok,
        "message"      => $ok ? "Cita guardada correctamente" : "Error al guardar la cita",
        "email_status" => $email_sent ? "sent" : "not_sent",
        "email_error"  => $email_err
    ]);
    exit;
}
echo json_encode(["success" => false, "message" => "Método no permitido"]);
