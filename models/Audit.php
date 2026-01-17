<?php
require_once '../config/database.php';

class Audit {
    private $db;
    private $table = 'auditoria';

    public $id;
    public $tabla;
    public $registro_id;
    public $accion;
    public $usuario_id;
    public $usuario_nombre;
    public $datos_anteriores;
    public $datos_nuevos;
    public $ip_address;
    public $created_at;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Registrar una acción de auditoría
     */
    public static function log($tabla, $registro_id, $accion, $datos_anteriores = null, $datos_nuevos = null) {
        $audit = new self();
        
        // Obtener usuario actual del token JWT si existe
        $usuario_id = null;
        $usuario_nombre = 'Sistema';
        
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            try {
                require_once '../vendor/firebase/php-jwt/src/JWT.php';
                require_once '../vendor/firebase/php-jwt/src/Key.php';
                $decoded = \Firebase\JWT\JWT::decode($matches[1], new \Firebase\JWT\Key('greymar_secret_key_2024', 'HS256'));
                $usuario_id = $decoded->user_id ?? null;
                $usuario_nombre = $decoded->username ?? 'Usuario';
            } catch (Exception $e) {
                // Token inválido, continuar sin usuario
            }
        }

        $query = "INSERT INTO {$audit->table} 
                 SET tabla = :tabla,
                     registro_id = :registro_id,
                     accion = :accion,
                     usuario_id = :usuario_id,
                     usuario_nombre = :usuario_nombre,
                     datos_anteriores = :datos_anteriores,
                     datos_nuevos = :datos_nuevos,
                     ip_address = :ip_address";

        $stmt = $audit->db->prepare($query);
        
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $datosAnt = $datos_anteriores ? json_encode($datos_anteriores, JSON_UNESCAPED_UNICODE) : null;
        $datosNuev = $datos_nuevos ? json_encode($datos_nuevos, JSON_UNESCAPED_UNICODE) : null;

        $stmt->bindParam(':tabla', $tabla);
        $stmt->bindParam(':registro_id', $registro_id, PDO::PARAM_INT);
        $stmt->bindParam(':accion', $accion);
        $stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
        $stmt->bindParam(':usuario_nombre', $usuario_nombre);
        $stmt->bindParam(':datos_anteriores', $datosAnt);
        $stmt->bindParam(':datos_nuevos', $datosNuev);
        $stmt->bindParam(':ip_address', $ip);

        return $stmt->execute();
    }

    /**
     * Obtener historial de auditoría con filtros
     */
    public function getAll($filters = []) {
        $query = "SELECT a.*, u.nombre as usuario_nombre_actual 
                  FROM {$this->table} a
                  LEFT JOIN usuarios u ON a.usuario_id = u.id
                  WHERE 1=1";
        
        $params = [];

        if (!empty($filters['tabla'])) {
            $query .= " AND a.tabla = :tabla";
            $params[':tabla'] = $filters['tabla'];
        }

        if (!empty($filters['registro_id'])) {
            $query .= " AND a.registro_id = :registro_id";
            $params[':registro_id'] = $filters['registro_id'];
        }

        if (!empty($filters['accion'])) {
            $query .= " AND a.accion = :accion";
            $params[':accion'] = $filters['accion'];
        }

        if (!empty($filters['usuario_id'])) {
            $query .= " AND a.usuario_id = :usuario_id";
            $params[':usuario_id'] = $filters['usuario_id'];
        }

        if (!empty($filters['fecha_desde'])) {
            $query .= " AND a.created_at >= :fecha_desde";
            $params[':fecha_desde'] = $filters['fecha_desde'];
        }

        if (!empty($filters['fecha_hasta'])) {
            $query .= " AND a.created_at <= :fecha_hasta";
            $params[':fecha_hasta'] = $filters['fecha_hasta'];
        }

        $query .= " ORDER BY a.created_at DESC";

        if (!empty($filters['limit'])) {
            $query .= " LIMIT " . intval($filters['limit']);
        }

        $stmt = $this->db->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtener registros recientes para dashboard
     */
    public function getRecent($limit = 10) {
        return $this->getAll(['limit' => $limit]);
    }

    /**
     * Obtener historial de un registro específico
     */
    public function getByRecord($tabla, $registro_id) {
        return $this->getAll([
            'tabla' => $tabla,
            'registro_id' => $registro_id
        ]);
    }
}
?>
