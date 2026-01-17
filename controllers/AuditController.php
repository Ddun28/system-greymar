<?php
require_once '../models/Audit.php';

class AuditController {
    private $model;

    public function __construct() {
        $this->model = new Audit();
        header('Content-Type: application/json');
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];

        try {
            switch ($method) {
                case 'GET':
                    $this->getAuditLogs();
                    break;
                default:
                    $this->sendError("Método no permitido", 405);
            }
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 500);
        }
    }

    private function getAuditLogs() {
        $filters = [];

        if (!empty($_GET['tabla'])) {
            $filters['tabla'] = $_GET['tabla'];
        }
        if (!empty($_GET['registro_id'])) {
            $filters['registro_id'] = $_GET['registro_id'];
        }
        if (!empty($_GET['accion'])) {
            $filters['accion'] = $_GET['accion'];
        }
        if (!empty($_GET['usuario_id'])) {
            $filters['usuario_id'] = $_GET['usuario_id'];
        }
        if (!empty($_GET['fecha_desde'])) {
            $filters['fecha_desde'] = $_GET['fecha_desde'];
        }
        if (!empty($_GET['fecha_hasta'])) {
            $filters['fecha_hasta'] = $_GET['fecha_hasta'];
        }
        if (!empty($_GET['limit'])) {
            $filters['limit'] = $_GET['limit'];
        } else {
            $filters['limit'] = 50; // Default limit
        }

        $logs = $this->model->getAll($filters);

        echo json_encode([
            'status' => 'success',
            'data' => $logs
        ]);
    }

    private function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode(['error' => true, 'message' => $message]);
        exit;
    }
}

// Ejecutar controlador
$controller = new AuditController();
$controller->handleRequest();
?>
