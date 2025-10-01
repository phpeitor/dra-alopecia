<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';

class Mailer {
  private PHPMailer $m;

  public function __construct(array $cfg) {
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

      $this->m->isHTML(true);
      $this->m->Subject = "Confirmación de cita — {$fechaNice}";
      $this->m->Body = "
          <div style='font-family:Arial,sans-serif;font-size:14px;color:#222'>
              <h2 style='color:#405F8D;margin:0 0 10px'>Cita registrada</h2>
              <p>Hola <strong>".htmlspecialchars($toName)."</strong>,</p>
              <p>Tu cita quedó registrada con los siguientes datos:</p>
              <ul>
                <li><strong>Profesional:</strong> ".htmlspecialchars($prof)."</li>
                <li><strong>Fecha y hora:</strong> ".htmlspecialchars($fechaNice)."</li>
                <li><strong>Precio:</strong> S/. ".htmlspecialchars($precio)."</li>
                ".($dni   ? "<li><strong>DNI:</strong> ".htmlspecialchars($dni)."</li>" : "")."
                ".($tel   ? "<li><strong>Teléfono:</strong> ".htmlspecialchars($tel)."</li>" : "")."
              </ul>
              <p>Si necesitas reprogramar o cancelar, responde este correo.</p>
              <p style='margin-top:20px'>Gracias,<br><strong>Alopecia Corp.</strong></p>
          </div>";
      $this->m->AltBody = "Cita registrada\n"
            ."Profesional: $prof\n"
            ."Fecha y hora: $fechaNice\n"
            ."Precio: S/. $precio\n";

      return $this->m->send();
    } catch (Exception $e) {
      error_log('Mailer error: '.$e->getMessage());
      return false;
    }
  }
}
