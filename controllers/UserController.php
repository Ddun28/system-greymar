<?php
require_once '../models/User.php';

class UserController {
    private $model;

    public function __construct() {
        $this->model = new User();
        header('Content-Type: application/json'); // Header global JSON
    }

    public function handleRequest() {
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            $id = $_GET['id'] ?? null;
            $input = json_decode(file_get_contents('php://input'), true); // Leer JSON

            switch ($method) {
                case 'GET':
                    $id ? $this->getUser($id) : $this->listUsers();
                    break;
                case 'POST':
                    $this->createUser($input);
                    break;
                case 'PUT':
                    $this->updateUser($id, $input);
                    break;
                case 'DELETE':
                    $this->deleteUser($id);
                    break;
                default:
                    $this->sendError("Método no permitido", 405);
            }
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 500);
        }
    }

      private function listUsers() {
        $stmt = $this->model->read();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode([
            'status' => 'success',
            'data' => $users
        ]);
    }

    private function getUser($id) {
    $this->model->id = $id;
    $user = $this->model->read()->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) $this->sendError("Usuario no encontrado", 404);
    
    // Envuelve la respuesta en estructura consistente
    echo json_encode([
        'status' => 'success',
        'data' => $user
    ]);
}

    private function createUser($data) {
        try {
            $this->validateData($data, ['nombre', 'apellido', 'correo', 'usuario', 'cargo', 'password']);
            
            $this->model->nombre = $data['nombre'];
            $this->model->apellido = $data['apellido'];
            $this->model->correo = $data['correo'];
            $this->model->usuario = $data['usuario'];
            $this->model->cargo = $data['cargo'];
            $this->model->password = $data['password'];

            if ($this->model->create()) {
                http_response_code(201);
                echo json_encode(['status' => 'success' ,'message' => 'Usuario creado']);
            }
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function updateUser($id, $data) {
        try {
            $this->model->id = $id;
            $this->validateData($data, ['nombre', 'apellido', 'correo', 'usuario', 'cargo']);
            
            $this->model->nombre = $data['nombre'];
            $this->model->apellido = $data['apellido'];
            $this->model->correo = $data['correo'];
            $this->model->usuario = $data['usuario'];
            $this->model->cargo = $data['cargo'];

            if ($this->model->update()) {
                  echo json_encode([
                'status' => 'success',
                'message' => 'Usuario actualizado',
                'data' => $this->model->read()->fetch(PDO::FETCH_ASSOC) 
            ]);
            }
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function deleteUser($id) {
        try {
            $this->model->id = $id;
            
            if ($this->model->delete()) {
                echo json_encode(['status' => 'success',
                'message' => 'Usuario eliminado']);
            }
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }

    private function validateData($data, $requiredFields) {
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                throw new Exception("El campo $field es requerido");
            }
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

$controller = new UserController();
$controller->handleRequest();