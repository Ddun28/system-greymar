<?php
require_once '../models/Movements.php';

class MovementController {
    private $model;

    public function __construct() {
        $this->model = new Movement();
        header('Content-Type: application/json');
    }

    public function handleRequest() {
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            $limit = $_GET['limit'] ?? 10;

            switch ($method) {
                case 'GET':
                    $this->getRecentMovements($limit);
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Método no permitido']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    private function getRecentMovements($limit) {
        try {
            $movements = $this->model->getRecent($limit);
            echo json_encode([
                'status' => 'success',
                'data' => $movements
            ]);
        } catch (Exception $e) {
            throw new Exception("Error al obtener movimientos: " . $e->getMessage());
        }
    }
}

$controller = new MovementController();
$controller->handleRequest();
?>