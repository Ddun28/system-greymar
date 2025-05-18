<?php
require_once '../models/User.php';
require_once __DIR__.'/../vendor/firebase/php-jwt/src/JWT.php';
require_once __DIR__.'/../vendor/firebase/php-jwt/src/Key.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthController {
    private $model;
    private $key = 'hola'; // Cambiar por una clave segura en producción

    public function __construct() {
        $this->model = new User();
        header('Content-Type: application/json');
    }

    public function handleRequest() {
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            $action = $_GET['action'] ?? '';

            if ($method === 'POST' && $action === 'login') {
                $this->login();
            } elseif ($method === 'POST' && $action === 'logout') {
                $this->logout();
            } else {
                $this->sendError("Método no permitido", 405);
            }
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 500);
        }
    }

    private function login() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['usuario']) || empty($data['password'])) {
            $this->sendError("Usuario y contraseña son requeridos", 400);
        }

        $user = $this->model->getByUsername($data['usuario']);
        
        if (!$user || !password_verify($data['password'], $user['password'])) {
            $this->sendError("Credenciales inválidas", 401);
        }

        $payload = [
            'iat' => time(),
            'exp' => time() + (60 * 60), 
            'data' => [
                'id' => $user['id'],
                'usuario' => $user['usuario'],
                'nombre' => $user['nombre'],
                'apellido' => $user['apellido'],
                'cargo' => $user['cargo']
            ]
        ];

        $jwt = JWT::encode($payload, $this->key, 'HS256');
        
        echo json_encode([
            'status' => 'success',
            'token' => $jwt
        ]);
    }

    private function logout() {
        try {
            $headers = getallheaders();
            $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
            
            JWT::decode($token, new Key($this->key, 'HS256'));
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Sesión cerrada correctamente'
            ]);
        } catch (Exception $e) {
            $this->sendError('Token inválido o expirado', 401);
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

$controller = new AuthController();
$controller->handleRequest();