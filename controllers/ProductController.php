<?php
require_once '../models/Product.php';
require_once '../models/Movements.php';

class ProductController {
    private $model;
    private $apiKey = 'a66549087e89549771fa88ca28c6f383';
    private $uploadUrl = 'https://api.imgbb.com/1/upload';

    public function __construct() {
        $this->model = new Product();
        header('Content-Type: application/json');
    }
    
     public function beginTransaction() {
        $this->db->beginTransaction();
    }

    public function commit() {
        $this->db->commit();
    }

    public function rollBack() {
        $this->db->rollBack();
    }

    public function handleRequest() {
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            // Soporta override de método por clientes que envían multipart/form-data (ej. X-HTTP-Method-Override: PUT)
            if (!empty($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
                $method = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'];
            }
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

            if ($action === 'low-stock' && $method === 'GET') {
                $this->getLowStockProducts();
                return;
            }

            if ($action === 'alerts' && $method === 'GET') {
                $this->getStockAlerts();
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

            // Iniciar transacción usando el modelo Product
            $this->model->beginTransaction();

            // Actualizar stock
            $this->model->stock = $newStock;
            $this->model->update();

            // Registrar movimiento usando el movementModel
            $this->movementModel->producto_id = $productId;
            $this->movementModel->tipo = $input['tipo'];
            $this->movementModel->cantidad = $input['cantidad'];
            $this->movementModel->motivo = $input['motivo'] ?? null;
            $this->movementModel->create();

            $this->model->commit();

            echo json_encode([
                'status' => 'success',
                'message' => 'Movimiento registrado',
                'new_stock' => $newStock
            ]);
            
        } catch (Exception $e) {
            $this->model->rollBack();
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
        // Para formularios multipart (con o sin archivos) — leer $_POST cuando exista
        if (!empty($_FILES) || !empty($_POST)) {
            $data = [
                'nombre' => $_POST['nombre'] ?? null,
                'descripcion' => $_POST['descripcion'] ?? null,
                'categoria_id' => $_POST['categoria_id'] ?? null,
                'stock' => $_POST['stock'] ?? 0,
                'precio' => $_POST['precio'] ?? 0,
                'stock_minimo' => $_POST['stock_minimo'] ?? 5,
            ];

            // Priorizar archivo subido; si no hay, aceptar imagen_actual (referencia URL)
            if (!empty($_FILES['imagen'])) {
                $data['imagen'] = $this->handleImageUpload($_FILES['imagen']);
            } elseif (!empty($_POST['imagen_actual'])) {
                $data['imagen'] = $_POST['imagen_actual'];
            } else {
                $data['imagen'] = null;
            }

            return $data;
        }

        // Para JSON
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    private function getLowStockProducts() {
        try {
            $products = $this->model->getLowStockProducts();
            echo json_encode(['status' => 'success', 'data' => $products]);
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function getStockAlerts() {
        try {
            $products = $this->model->getLowStockProducts();
            $alerts = array_map(function($p) {
                return [
                    'id' => $p['id'],
                    'nombre' => $p['nombre'],
                    'stock' => $p['stock'],
                    'stock_minimo' => $p['stock_minimo'],
                    'diferencia' => $p['stock_minimo'] - $p['stock'],
                    'categoria' => $p['categoria'] ?? 'Sin categoría',
                    'mensaje' => $p['stock'] == 0 
                        ? "¡Sin stock!" 
                        : "Stock bajo: {$p['stock']}/{$p['stock_minimo']}"
                ];
            }, $products);
            
            echo json_encode([
                'status' => 'success',
                'count' => count($alerts),
                'data' => $alerts
            ]);
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
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
            // Validar campos requeridos
            if (empty($data['nombre']) || empty($data['categoria_id'])) {
                throw new Exception("Campos requeridos faltantes");
            }

            $this->model->nombre = $data['nombre'];
            $this->model->descripcion = $data['descripcion'] ?? null;
            $this->model->imagen = $data['imagen'] ?? null;
            $this->model->categoria_id = $data['categoria_id'];
            $this->model->stock = $data['stock'] ?? 0;
            $this->model->precio = $data['precio'] ?? 0;
            $this->model->stock_minimo = $data['stock_minimo'] ?? 5;
            $this->model->creado_por = $this->getCurrentUserId();

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
            // Validar campos requeridos
            if (empty($data['nombre']) || empty($data['categoria_id'])) {
                throw new Exception("Campos requeridos faltantes");
            }

            $this->model->id = $id;
            $this->model->nombre = $data['nombre'];
            $this->model->descripcion = $data['descripcion'] ?? null;
            $this->model->imagen = $data['imagen'] ?? null;
            $this->model->categoria_id = $data['categoria_id'];
            $this->model->stock = $data['stock'] ?? 0;
            $this->model->precio = $data['precio'] ?? 0;
            $this->model->stock_minimo = $data['stock_minimo'] ?? 5;
            $this->model->actualizado_por = $this->getCurrentUserId();

            $this->model->update();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Producto actualizado'
            ]);
            
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function getCurrentUserId() {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            try {
                require_once '../vendor/firebase/php-jwt/src/JWT.php';
                require_once '../vendor/firebase/php-jwt/src/Key.php';
                $decoded = \Firebase\JWT\JWT::decode($matches[1], new \Firebase\JWT\Key('greymar_secret_key_2024', 'HS256'));
                return $decoded->user_id ?? null;
            } catch (Exception $e) {
                return null;
            }
        }
        return null;
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
