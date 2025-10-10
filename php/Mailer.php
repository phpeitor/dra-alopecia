<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';

class Mailer {
  private PHPMailer $m;
  private array $cfg; 

  public function __construct(array $cfg) {
    $this->cfg = $cfg; 
    $this->m = new PHPMailer(true);
    $this->m->isSMTP();
    $this->m->Host       = $cfg['host'];
    $this->m->SMTPAuth   = true;
    $this->m->Username   = $cfg['username'];
    $this->m->Password   = $cfg['password'];
    $this->m->SMTPSecure = $cfg['secure'];      
    $this->m->Port       = $cfg['port'];    
    $this->m->setFrom($cfg['from_email'], $cfg['from_name'] ?? '');
    if (!empty($cfg['reply_to']['email'])) {
      $this->m->addReplyTo($cfg['reply_to']['email'], $cfg['reply_to']['name'] ?? '');
    }

    $this->m->SMTPOptions = [
      'ssl' => [
        'verify_peer'       => true,
        'verify_peer_name'  => true,
        'allow_self_signed' => false,
      ],
    ];

    $this->m->CharSet = 'UTF-8';
  }

  private function buildIcsFromCita(array $cita): ?string {
    $tz = new DateTimeZone('America/Lima');
    $nice = trim($cita['fecha_cita_nice'] ?? '');
    if (!$nice) return null;
    $start = DateTime::createFromFormat('Y-m-d H:i:s', $nice, $tz);
    if (!$start) {
      $start = DateTime::createFromFormat('Y-m-d H:i', $nice, $tz);
    }
    if (!$start) return null; 

    $durMin = (int)($cita['duracion_min'] ?? 45);
    $end    = (clone $start)->modify("+{$durMin} minutes");

    $prof = $cita['profesional'] ?? 'Consulta médica';
    $sede = trim($cita['sede'] ?? '');
    $tipo = strtolower(trim($cita['tipo'] ?? 'presencial'));

    $addressMap = [
      'Lima'     => 'Av. José Pardo 513 Of. 701 - Miraflores',
      'Arequipa' => 'Av. Cayma 404 - Arequipa',
    ];

    $summary  = "Consulta con {$prof}";
    $location = ($tipo === 'presencial')
      ? trim($sede . (isset($addressMap[$sede]) ? ' — '.$addressMap[$sede] : ''))
      : ($sede ?: 'Online');

    $desc = "Tipo: ".($tipo === 'presencial' ? 'Presencial' : 'Virtual');
    if ($sede) $desc .= "\nSede: $sede";

    $uid = bin2hex(random_bytes(8)).'@alopecia.local';
    $fmt = function(DateTime $d, bool $utc=false) {
      if ($utc) $d = (clone $d)->setTimezone(new DateTimeZone('UTC'));
      return $d->format('Ymd\THis').($utc ? 'Z' : '');
    };

    $ics = "BEGIN:VCALENDAR\r\n"
        . "PRODID:-//Alopecia Corp//Citas//ES\r\n"
        . "VERSION:2.0\r\n"
        . "CALSCALE:GREGORIAN\r\n"
        . "METHOD:REQUEST\r\n"
        . "BEGIN:VTIMEZONE\r\n"
        . "TZID:America/Lima\r\n"
        . "X-LIC-LOCATION:America/Lima\r\n"
        . "BEGIN:STANDARD\r\n"
        . "TZOFFSETFROM:-0500\r\n"
        . "TZOFFSETTO:-0500\r\n"
        . "TZNAME:-05\r\n"
        . "DTSTART:19700101T000000\r\n"
        . "END:STANDARD\r\n"
        . "END:VTIMEZONE\r\n"
        . "BEGIN:VEVENT\r\n"
        . "UID:{$uid}\r\n"
        . "DTSTAMP:".$fmt(new DateTime('now', new DateTimeZone('UTC')), true)."\r\n"
        . "DTSTART;TZID=America/Lima:".$fmt($start)."\r\n"
        . "DTEND;TZID=America/Lima:".$fmt($end)."\r\n"
        . "SUMMARY:".addcslashes($summary, ",;")."\r\n"
        . "LOCATION:".addcslashes($location, ",;")."\r\n"
        . "DESCRIPTION:".preg_replace("/\r?\n/", "\\n", addcslashes($desc, ",;"))."\r\n"
        . "STATUS:CONFIRMED\r\n"
        . "BEGIN:VALARM\r\n"
        . "TRIGGER:-PT24H\r\n"
        . "ACTION:DISPLAY\r\n"
        . "DESCRIPTION:Recordatorio de cita\r\n"
        . "END:VALARM\r\n"
        . "END:VEVENT\r\n"
        . "END:VCALENDAR\r\n";

    return $ics;
  }

  private function signActionUrl(array $cita, string $action, array $cfg): ?string {
    $id = (int)($cita['id'] ?? 0);
    if ($id <= 0) return null;

    $base = $cfg['action_base_url'] ?? '';
    $secret = $cfg['action_secret'] ?? '';
    $ttlMin = (int)($cfg['action_ttl_min'] ?? 0);
    if (!$base || !$secret) return null;

    $exp = $ttlMin > 0 ? (time() + $ttlMin * 60) : (time() + 72*3600); 
    $payload = $id.'|'.$action.'|'.$exp;
    $sig = hash_hmac('sha256', $payload, $secret);

    $qs = http_build_query([
      'id' => $id,
      'action' => $action,
      'exp' => $exp,
      'sig' => $sig,
    ]);
    return rtrim($base, '?').'?'.$qs;
  }

  public function sendConfirmation(string $toEmail, string $toName, array $cita, ?string $bcc = null): bool {
    try {
      $this->m->clearAddresses();
      $this->m->clearAttachments();
      $this->m->addAddress($toEmail, $toName);
      if ($bcc) $this->m->addBCC($bcc);

      $fechaNice = $cita['fecha_cita_nice'] ?? '';
      $prof      = $cita['profesional'] ?? '';
      $precio    = $cita['precio'] ?? '';
      $dni       = $cita['dni'] ?? '';
      $tel       = $cita['telefono'] ?? '';
      $sede      = trim($cita['sede'] ?? '');
      $tipo      = strtolower(trim($cita['tipo'] ?? ''));
      $reprogUrl = $this->signActionUrl($cita, 'reprogramar', $this->cfg);
      $anularUrl = $this->signActionUrl($cita, 'anular',      $this->cfg);
      $addressMap = [
        'Lima'     => 'Av. José Pardo 513 Of. 701 - Miraflores',
        'Arequipa' => 'Av. Cayma 404 - Arequipa',
      ];

      $isPresencial = ($tipo === 'presencial');
      $direccionSede = $addressMap[$sede] ?? null;
      $showSede = $sede !== '';
      $showDireccion = $isPresencial && $direccionSede; 
      $h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');

      $this->m->isHTML(true);
      $this->m->Subject = "Confirmación de cita — {$fechaNice}";
      $this->m->Body = "
        <div style='font-family:Arial,sans-serif;font-size:14px;color:#222'>
          <h2 style='color:#405F8D;margin:0 0 10px'>Cita registrada</h2>
          <p>Hola <strong>".$h($toName)."</strong>,</p>
          <p>Tu cita quedó registrada con los siguientes datos:</p>
          <ul>
            <li><strong>Profesional:</strong> ".$h($prof)."</li>
            <li><strong>Fecha y hora:</strong> ".$h($fechaNice)."</li>
            <li><strong>Tipo:</strong> ".($isPresencial ? 'Presencial' : 'Virtual')."</li>
            <li><strong>Precio:</strong> S/. ".$h($precio)."</li>"
            .($dni ? "<li><strong>DNI/CEX/Pasaporte:</strong> ".$h($dni)."</li>" : "")
            .($showSede ? "<li><strong>Sede:</strong> ".$h($sede)."</li>" : "")
            .($showDireccion ? "<li><strong>Dirección:</strong> ".$h($direccionSede)."</li>" : "")
          ."</ul>"
          .( ($reprogUrl || $anularUrl) ? (
            "<p>Si necesitas reprogramar o anular, haga clic en las opciones: "
            . ($reprogUrl ? "<a href='".htmlspecialchars($reprogUrl,ENT_QUOTES,'UTF-8')."'>Reprogramar</a>" : "")
            . (($reprogUrl && $anularUrl) ? " | " : "")
            . ($anularUrl ? "<a href='".htmlspecialchars($anularUrl,ENT_QUOTES,'UTF-8')."'>Anular</a>" : "")
            . "</p>"
          ) : "" )
          ."<p style='margin-top:20px'>Gracias,<br><strong>Alopecia Corp.</strong></p>
        </div>";

      $alt = "Cita registrada\n"
          ."Profesional: $prof\n"
          ."Fecha y hora: $fechaNice\n"
          ."Tipo: ".($isPresencial ? 'Presencial' : 'Virtual')."\n"
          ."Precio: S/. $precio\n";

      if ($showSede)      { $alt .= "Sede: $sede\n"; }
      if ($showDireccion) { $alt .= "Dirección: $direccionSede\n"; }
      if ($reprogUrl) $alt .= "Reprogramar: $reprogUrl\n";
      if ($anularUrl) $alt  .= "Anular: $anularUrl\n";
      $this->m->AltBody = $alt;

      $ics = $this->buildIcsFromCita($cita);
      if ($ics) {
        $this->m->addStringAttachment(
          $ics,
          'cita.ics',
          'base64',
          'text/calendar; method=REQUEST; charset=UTF-8'
        );
      }

      return $this->m->send();

    } catch (Exception $e) {
      error_log('Mailer error: '.$e->getMessage());
      return false;
    }
  }
}
