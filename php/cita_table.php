<?php
header("Content-Type: application/json; charset=UTF-8");
date_default_timezone_set("America/Lima");

require_once "conexion.php";

try {
    $conexion = new Conexion();
    $conn = $conexion->conectar();

    $from = isset($_GET['from']) ? trim($_GET['from']) : null; // YYYY-MM-DD
    $to   = isset($_GET['to'])   ? trim($_GET['to'])   : null;

    $validDate = fn($s) => is_string($s) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $s);

    // Filtros de fecha
    if ($validDate($from) && $validDate($to)) {
    if ($from === $to) {
        // Un solo día: [day 00:00:00, day +1 00:00:00)
        $where[] = "fecha_cita >= :d_ini AND fecha_cita < :d_fin";
        $params[':d_ini'] = $from . " 00:00:00";
        $params[':d_fin'] = date('Y-m-d H:i:s', strtotime($from . ' 00:00:00 +1 day'));
    } else {
        // Rango multi-día
        $where[] = "fecha_cita >= :from AND fecha_cita <= :to";
        $params[':from'] = $from . " 00:00:00";
        $params[':to']   = $to   . " 23:59:59";
    }
    } elseif ($validDate($from)) {
        $where[] = "fecha_cita >= :from";
        $params[':from'] = $from . " 00:00:00";
    } elseif ($validDate($to)) {
        $where[] = "fecha_cita <= :to";
        $params[':to'] = $to . " 23:59:59";
    } else {
        // Sin filtros de fecha: últimos 30 días hacia adelante (hoy-15 a hoy+15)
        $hoy = new DateTime('now', new DateTimeZone('America/Lima'));
        $ini = (clone $hoy)->modify('-15 days')->format('Y-m-d') . ' 00:00:00';
        $fin = (clone $hoy)->modify('+15 days')->format('Y-m-d') . ' 23:59:59';
        $where[] = "fecha_cita BETWEEN :auto_ini AND :auto_fin";
        $params[':auto_ini'] = $ini;
        $params[':auto_fin'] = $fin;
    }

    $sede = $_GET['sede'] ?? null;
    $tipo = $_GET['tipo'] ?? null; // presencial|virtual
    $status = $_GET['status'] ?? null;
    $profesional = $_GET['profesional'] ?? null;
    $limit = isset($_GET['limit']) ? max(1, min(5000, (int)$_GET['limit'])) : 1000;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

    $where = [];
    $params = [];

    if ($from && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
    $where[] = "fecha_cita >= :from";
    $params[':from'] = $from . " 00:00:00";
    }
    if ($to && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
    $where[] = "fecha_cita <= :to";
    $params[':to'] = $to . " 23:59:59";
    }
    if ($sede) {
    $where[] = "sede = :sede";
    $params[':sede'] = $sede;
    }
    if ($tipo) {
    $where[] = "LOWER(tipo) = :tipo";
    $params[':tipo'] = strtolower($tipo);
    }
    if ($status) {
    $where[] = "status = :status";
    $params[':status'] = $status;
    }
    if ($profesional) {
    $where[] = "profesional LIKE :prof";
    $params[':prof'] = "%".$profesional."%";
    }

    $sql = "SELECT id, nombre, email, dni, telefono, fecha_nacimiento, direccion, mensaje,
                    fecha_cita, precio, fecha_registro, profesional, status, sede, tipo
            FROM citas";
    if ($where) {
    $sql .= " WHERE " . implode(" AND ", $where);
    }
    $sql .= " ORDER BY fecha_cita DESC, id DESC LIMIT :limit OFFSET :offset";

    $stmt = $conn->prepare($sql);

    foreach ($params as $k => $v) {
    $stmt->bindValue($k, $v);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
    'success' => true,
    'data' => $rows,
    'count' => count($rows),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
    'success' => false,
    'message' => 'Error al obtener citas: '.$e->getMessage(),
    ]);
}
