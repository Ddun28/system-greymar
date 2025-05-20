<?php
require_once '../models/Product.php';
require_once '../models/Movements.php';

class MovementController {
    private $productModel;
    private $movementModel;

    public function __construct() {
        $this->productModel = new Product();
        $this->movementModel = new Movement();
        header('Content-Type: application/json');
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $id = $_GET['id'] ?? null;

        try {
            switch ($method) {
                case 'GET':
                    $this->getMovements($id);
                    break;
                case 'POST':
                    $this->createMovement();
                    break;
                case 'DELETE':
                    $this->deleteMovement($id);
                    break;
                case 'PUT':
                    $this->updateMovement();
                    break;
                default:
                    $this->sendError("Método no permitido", 405);
            }
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 500);
        }
    }

    private function createMovement() {
        $input = json_decode(file_get_contents('php://input'), true);
        $required = ['product_id', 'tipo', 'cantidad'];
        
        foreach ($required as $field) {
            if (empty($input[$field])) {
                $this->sendError("Campo requerido: $field", 400);
            }
        }

        try {
            // Obtener producto
            $this->productModel->id = $input['product_id'];
            $product = $this->productModel->read()->fetch(PDO::FETCH_ASSOC);
            
            if (!$product) {
                throw new Exception("Producto no encontrado");
            }

            // Validar stock para salidas
            if ($input['tipo'] === 'salida' && $product['stock'] < $input['cantidad']) {
                throw new Exception("Stock insuficiente");
            }

            // Registrar movimiento
            $this->movementModel->producto_id = $input['product_id'];
            $this->movementModel->tipo = $input['tipo'];
            $this->movementModel->cantidad = $input['cantidad'];
            $this->movementModel->motivo = $input['motivo'] ?? null;

            $this->productModel->beginTransaction();
            $this->movementModel->create();
            $this->productModel->commit();

            echo json_encode([
                'status' => 'success',
                'message' => 'Movimiento registrado'
            ]);
            
        } catch (Exception $e) {
            $this->productModel->rollBack();
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function updateMovement() {
    $input = json_decode(file_get_contents('php://input'), true);
    $required = ['id', 'tipo', 'cantidad'];
    
    foreach ($required as $field) {
        if (empty($input[$field])) {
            $this->sendError("Campo requerido: $field", 400);
        }
    }

    try {
        // Obtener movimiento existente
        $existing = $this->movementModel->getById($input['id']);
        if (!$existing) {
            throw new Exception("Movimiento no encontrado");
        }

        // Validar stock si es salida
        if ($input['tipo'] === 'salida') {
            $this->productModel->id = $existing['producto_id'];
            $product = $this->productModel->read()->fetch(PDO::FETCH_ASSOC);
            
            $stockDifference = $input['cantidad'] - $existing['cantidad'];
            if (($product['stock'] + $stockDifference) < 0) {
                throw new Exception("Stock insuficiente");
            }
        }

        // Actualizar movimiento
        $this->movementModel->id = $input['id'];
        $this->movementModel->tipo = $input['tipo'];
        $this->movementModel->cantidad = $input['cantidad'];
        $this->movementModel->motivo = $input['motivo'] ?? null;
        
        $this->movementModel->update();
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Movimiento actualizado'
        ]);
        
    } catch (Exception $e) {
        $this->sendError($e->getMessage(), 400);
    }
}

// Modificar getMovements para obtener por ID de movimiento
private function getMovements($id) {
    try {
        if ($id) {
            // Obtener movimiento específico
            $movement = $this->movementModel->getById($id);
            echo json_encode(['status' => 'success', 'data' => $movement]);
        } else {
            // Obtener todos los movimientos
            $movements = $this->movementModel->getRecent(10);
            echo json_encode(['status' => 'success', 'data' => $movements]);
        }
    } catch (Exception $e) {
        $this->sendError($e->getMessage(), 400);
    }
}

    private function deleteMovement($id) {
        try {
            $this->movementModel->id = $id;
            $this->movementModel->delete();
            echo json_encode(['status' => 'success', 'message' => 'Movimiento eliminado']);
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode(['error' => true, 'message' => $message]);
        exit;
    }
}

$controller = new MovementController();
$controller->handleRequest();