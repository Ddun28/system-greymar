<?php
require_once '../models/Category.php';

class CategoryController {
    private $model;

    public function __construct() {
        $this->model = new Category();
        header('Content-Type: application/json');
    }

    public function handleRequest() {
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            $id = $_GET['id'] ?? null;
            $input = json_decode(file_get_contents('php://input'), true);

            switch ($method) {
                case 'GET':
                    $id ? $this->getCategory($id) : $this->listCategories();
                    break;
                case 'POST':
                    $this->createCategory($input);
                    break;
                case 'PUT':
                    $this->updateCategory($id, $input);
                    break;
                case 'DELETE':
                    $this->deleteCategory($id);
                    break;
                default:
                    $this->sendError("Método no permitido", 405);
            }
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 500);
        }
    }

    private function listCategories() {
        $stmt = $this->model->read();
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $categories]);
    }

    private function getCategory($id) {
        $this->model->id = $id;
        $category = $this->model->read()->fetch(PDO::FETCH_ASSOC);
        
        if (!$category) $this->sendError("Categoría no encontrada", 404);
        
        echo json_encode(['status' => 'success', 'data' => $category]);
    }

    private function createCategory($data) {
        $this->model->nombre = $data['nombre'];
        $this->model->descripcion = $data['descripcion'] ?? null;

        if ($this->model->create()) {
            http_response_code(201);
            echo json_encode(['status' => 'success', 'message' => 'Categoría creada']);
        }
    }

    private function updateCategory($id, $data) {
        $this->model->id = $id;
        $this->model->nombre = $data['nombre'];
        $this->model->descripcion = $data['descripcion'] ?? null;

        if ($this->model->update()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Categoría actualizada',
                'data' => $this->model->read()->fetch(PDO::FETCH_ASSOC)
            ]);
        }
    }

    private function deleteCategory($id) {
        $this->model->id = $id;
        
        if ($this->model->delete()) {
            echo json_encode(['status' => 'success', 'message' => 'Categoría eliminada']);
        }
    }

    private function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode(['error' => true, 'message' => $message]);
        exit;
    }
}

$controller = new CategoryController();
$controller->handleRequest();
?>