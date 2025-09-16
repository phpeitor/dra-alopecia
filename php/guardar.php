<?php
header("Content-Type: application/json; charset=UTF-8");
date_default_timezone_set("America/Lima");
require_once "cita.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $cita = new Cita();

    $fecha_cita_str = $_POST["fec_cita"] ?? "";
    $fecha_cita_mysql = null;

    if ($fecha_cita_str) {
        // sacar solo fecha y hora con regex
        if (preg_match('/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/', $fecha_cita_str, $m)) {
            $fecha_cita_mysql = $m[1] . " " . $m[2] . ":00"; // yyyy-mm-dd hh:mm:ss
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
        "profesional"      => $_POST["doctor"] ?? ""
    ];
    //var_dump($data);

    $ok = $cita->guardar($data);

    echo json_encode([
        "success" => $ok,
        "message" => $ok ? "Cita guardada correctamente" : "Error al guardar la cita"
    ]);
    exit;
}
echo json_encode(["success" => false, "message" => "Método no permitido"]);
