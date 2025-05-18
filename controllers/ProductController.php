<?php
require_once '../models/Product.php';
require_once '../models/Movement.php';

class ProductController {
    private $model;
    private $apiKey = 'a66549087e89549771fa88ca28c6f383';
    private $uploadUrl = 'https://api.imgbb.com/1/upload';

    public function __construct() {
        $this->model = new Product();
        header('Content-Type: application/json');
    }

    public function handleRequest() {
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            $id = $_GET['id'] ?? null;
            $action = $_GET['action'] ?? null;

            if ($action === 'movement' && $method === 'POST') {
                $this->handleMovementRequest($id);
                return;
            }

            if ($action === 'movimientos' && $method === 'GET') {
                $this->getMovements($id);
                return;
            }

            $input = $this->getInput();

            switch ($method) {
                case 'GET':
                    $id ? $this->getProduct($id) : $this->listProducts();
                    break;
                case 'POST':
                    $this->createProduct($input);
                    break;
                case 'PUT':
                    $this->updateProduct($id, $input);
                    break;
                case 'DELETE':
                    $this->deleteProduct($id);
                    break;
                default:
                    $this->sendError("Método no permitido", 405);
            }
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 500);
        }
    }

    private function handleMovementRequest($productId) {
        $input = json_decode(file_get_contents('php://input'), true);
        $required = ['tipo', 'cantidad'];
        
        foreach ($required as $field) {
            if (empty($input[$field])) {
                $this->sendError("El campo $field es requerido", 400);
            }
        }

        if (!in_array($input['tipo'], ['entrada', 'salida'])) {
            $this->sendError("Tipo de movimiento inválido", 400);
        }

        try {
            // Obtener producto
            $this->model->id = $productId;
            $product = $this->model->read()->fetch(PDO::FETCH_ASSOC);
            
            if (!$product) {
                throw new Exception("Producto no encontrado");
            }

            // Validar stock para salidas
            if ($input['tipo'] === 'salida' && $product['stock'] < $input['cantidad']) {
                throw new Exception("Stock insuficiente");
            }

            // Calcular nuevo stock
            $newStock = $input['tipo'] === 'entrada' 
                ? $product['stock'] + $input['cantidad']
                : $product['stock'] - $input['cantidad'];

            // Iniciar transacción
            $this->model->getDb()->beginTransaction();

            // Actualizar stock
            $this->model->stock = $newStock;
            $this->model->update();

            // Registrar movimiento
            $movement = new Movement();
            $movement->producto_id = $productId;
            $movement->tipo = $input['tipo'];
            $movement->cantidad = $input['cantidad'];
            $movement->motivo = $input['motivo'] ?? null;
            $movement->create();

            $this->model->getDb()->commit();

            echo json_encode([
                'status' => 'success',
                'message' => 'Movimiento registrado',
                'new_stock' => $newStock
            ]);
            
        } catch (Exception $e) {
            $this->model->getDb()->rollBack();
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function getMovements($productId) {
        try {
            $movement = new Movement();
            $movement->producto_id = $productId;
            $movimientos = $movement->read();
            
            echo json_encode([
                'status' => 'success',
                'data' => $movimientos
            ]);
            
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function getInput() {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        if (!empty($_FILES['imagen'])) {
            $input['imagen'] = $this->handleImageUpload($_FILES['imagen']);
        }
        
        return $input;
    }

    private function handleImageUpload($file) {
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!in_array($file['type'], $allowedTypes)) {
            throw new Exception("Solo se permiten imágenes JPG, PNG o GIF");
        }

        $imageData = base64_encode(file_get_contents($file['tmp_name']));
        
        $postData = [
            'key' => $this->apiKey,
            'image' => $imageData,
            'name' => uniqid() . '_' . $file['name']
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->uploadUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            $error = json_decode($response, true);
            throw new Exception("Error al subir imagen: " . ($error['error']['message'] ?? 'Error desconocido'));
        }

        $result = json_decode($response, true);
        return $result['data']['url'];
    }

    private function listProducts() {
        try {
            $stmt = $this->model->read();
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'data' => $products]);
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function getProduct($id) {
        try {
            $this->model->id = $id;
            $product = $this->model->read()->fetch(PDO::FETCH_ASSOC);
            
            if (!$product) {
                throw new Exception("Producto no encontrado");
            }
            
            echo json_encode(['status' => 'success', 'data' => $product]);
            
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 404);
        }
    }

    private function createProduct($data) {
        try {
            $this->model->nombre = $data['nombre'];
            $this->model->descripcion = $data['descripcion'] ?? null;
            $this->model->imagen = $data['imagen'] ?? null;
            $this->model->categoria_id = $data['categoria_id'];
            $this->model->stock = $data['stock'] ?? 0;

            $id = $this->model->create();
            
            http_response_code(201);
            echo json_encode([
                'status' => 'success',
                'message' => 'Producto creado',
                'data' => ['id' => $id]
            ]);
            
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function updateProduct($id, $data) {
        try {
            $this->model->id = $id;
            $this->model->nombre = $data['nombre'];
            $this->model->descripcion = $data['descripcion'] ?? null;
            $this->model->imagen = $data['imagen'] ?? null;
            $this->model->categoria_id = $data['categoria_id'];
            $this->model->stock = $data['stock'] ?? 0;

            $this->model->update();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Producto actualizado'
            ]);
            
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function deleteProduct($id) {
        try {
            $this->model->id = $id;
            $this->model->delete();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Producto eliminado'
            ]);
            
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'error' => true,
            'message' => $message
        ]);
        exit;
    }
}

$controller = new ProductController();
$controller->handleRequest();
?>