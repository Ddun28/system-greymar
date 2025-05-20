<?php
require_once '../config/database.php';

class Movement {
    private $db;
    private $table = 'movimientos_inventario';

    public $id;
    public $producto_id;
    public $tipo;
    public $cantidad;
    public $motivo;
    public $created_at;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create() {
        $this->validateRequiredFields(['producto_id', 'tipo', 'cantidad']);
        
        $query = "INSERT INTO $this->table 
                 SET producto_id = :producto_id,
                     tipo = :tipo,
                     cantidad = :cantidad,
                     motivo = :motivo";

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':producto_id', $this->producto_id, PDO::PARAM_INT);
        $stmt->bindParam(':tipo', $this->tipo);
        $stmt->bindParam(':cantidad', $this->cantidad, PDO::PARAM_INT);
        $stmt->bindParam(':motivo', $this->motivo);

        if(!$stmt->execute()) {
            throw new Exception("Error al registrar movimiento");
        }
        
        return true;
    }

    public function read() {
        $query = "SELECT * FROM $this->table";
        
        if(!empty($this->producto_id)) {
            $query .= " WHERE producto_id = :producto_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':producto_id', $this->producto_id, PDO::PARAM_INT);
        } else {
            $stmt = $this->db->prepare($query);
        }
        
        if(!$stmt->execute()) {
            throw new Exception("Error al obtener movimientos");
        }
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRecent($limit = 10) {
    $query = "SELECT m.*, p.nombre as producto_nombre 
              FROM movimientos_inventario m
              JOIN productos p ON m.producto_id = p.id
              ORDER BY m.created_at DESC
              LIMIT :limit";
    
    $stmt = $this->db->prepare($query);
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->execute();
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

    private function validateRequiredFields($fields) {
        foreach ($fields as $field) {
            if (empty($this->$field)) {
                throw new Exception("El campo $field es requerido");
            }
        }
    }
}
?>