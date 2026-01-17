<?php
class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        $host = 'localhost';
        $db   = 'proyecto_3er_trayecto';
        $user = 'root';
        $pass = '';
        $charset = 'utf8mb4';

        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            $this->pdo = new PDO($dsn, $user, $pass, $options);
        } catch (\PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'error' => true,
                'message' => 'Error de conexión a la base de datos'
            ]);
            // Opcional: registrar el error en el log en lugar de mostrar detalles en producción
            error_log('Database connection error: ' . $e->getMessage());
            exit;
        }
    }

    public static function getInstance() {
        if (!self::$instance) {
            self::$instance = new self();
        }
        return self::$instance->pdo;
    }

    public function connect() {
        return $this->pdo;
    }
}