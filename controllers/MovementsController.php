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
            $productStmt = $this->productModel->read();
            $product = $productStmt->fetch(PDO::FETCH_ASSOC);

            if (!$product) {
                throw new Exception("Producto no encontrado");
            }

            // Validar stock para salidas
            if ($input['tipo'] === 'salida' && $product['stock'] < $input['cantidad']) {
                throw new Exception("Stock insuficiente");
            }

            // Use Product::registerMovement to update stock and insert movimiento atomically
            $this->productModel->id = $input['product_id'];
            // set current stock so registerMovement can compute newStock
            $this->productModel->stock = (int)$product['stock'];

            $this->productModel->registerMovement($input['tipo'], (int)$input['cantidad'], $input['motivo'] ?? null);

            echo json_encode([
                'status' => 'success',
                'message' => 'Movimiento registrado'
            ]);

        } catch (Exception $e) {
            // registerMovement handles its own rollback; ensure any open rollback
            try { $this->productModel->rollBack(); } catch(Exception $ex) {}
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

        // Obtener producto actual
        $this->productModel->id = $existing['producto_id'];
        $productStmt = $this->productModel->read();
        $product = $productStmt->fetch(PDO::FETCH_ASSOC);
        if (!$product) throw new Exception('Producto asociado no encontrado');

        // Calculate stock adjustment: revert existing effect and apply new effect
        // existing effect: +cantidad for entrada, -cantidad for salida
        $oldEffect = ($existing['tipo'] === 'entrada') ? (int)$existing['cantidad'] : -((int)$existing['cantidad']);
        $newEffect = ($input['tipo'] === 'entrada') ? (int)$input['cantidad'] : -((int)$input['cantidad']);

        $newStock = (int)$product['stock'] - $oldEffect + $newEffect;
        if ($newStock < 0) throw new Exception('Stock insuficiente para aplicar los cambios');

        // Perform update in transaction: update product stock and movement record
        $this->productModel->beginTransaction();

        // Update product stock
        $this->productModel->stock = $newStock;
        $this->productModel->id = $product['id'];
        $this->productModel->update();

        // Update movement
        $this->movementModel->id = $input['id'];
        $this->movementModel->tipo = $input['tipo'];
        $this->movementModel->cantidad = (int)$input['cantidad'];
        $this->movementModel->motivo = $input['motivo'] ?? null;
        $this->movementModel->update();

        $this->productModel->commit();

        echo json_encode([
            'status' => 'success',
            'message' => 'Movimiento actualizado'
        ]);

    } catch (Exception $e) {
        try { $this->productModel->rollBack(); } catch(Exception $ex) {}
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
            // Find movement to reverse its effect
            $movement = $this->movementModel->getById($id);
            if (!$movement) throw new Exception('Movimiento no encontrado');

            // Get product
            $this->productModel->id = $movement['producto_id'];
            $productStmt = $this->productModel->read();
            $product = $productStmt->fetch(PDO::FETCH_ASSOC);
            if (!$product) throw new Exception('Producto asociado no encontrado');

            // Compute reversed stock
            $effect = ($movement['tipo'] === 'entrada') ? (int)$movement['cantidad'] : -((int)$movement['cantidad']);
            // To revert, subtract effect
            $revertedStock = (int)$product['stock'] - $effect;
            if ($revertedStock < 0) throw new Exception('No se puede eliminar movimiento: dejaría stock negativo');

            // Transaction: update product stock then delete movement
            $this->productModel->beginTransaction();
            $this->productModel->stock = $revertedStock;
            $this->productModel->id = $product['id'];
            $this->productModel->update();

            $this->movementModel->id = $id;
            $this->movementModel->delete();

            $this->productModel->commit();

            echo json_encode(['status' => 'success', 'message' => 'Movimiento eliminado']);
        } catch (Exception $e) {
            try { $this->productModel->rollBack(); } catch(Exception $ex) {}
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