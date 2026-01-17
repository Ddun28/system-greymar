<?php
require_once '../config/database.php';
require_once '../models/Audit.php';

class Movement {
    private $db;
    private $table = 'movimientos_inventario';

    public $id;
    public $producto_id;
    public $tipo;
    public $cantidad;
    public $motivo;
    public $usuario_id;
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
                     motivo = :motivo,
                     usuario_id = :usuario_id";

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':producto_id', $this->producto_id, PDO::PARAM_INT);
        $stmt->bindParam(':tipo', $this->tipo);
        $stmt->bindParam(':cantidad', $this->cantidad, PDO::PARAM_INT);
        $stmt->bindParam(':motivo', $this->motivo);
        $stmt->bindParam(':usuario_id', $this->usuario_id, PDO::PARAM_INT);

        if(!$stmt->execute()) {
            throw new Exception("Error al registrar movimiento");
        }
        
        $newId = $this->db->lastInsertId();
        
        // Registrar auditoría
        Audit::log('movimientos_inventario', $newId, 'crear', null, [
            'producto_id' => $this->producto_id,
            'tipo' => $this->tipo,
            'cantidad' => $this->cantidad,
            'motivo' => $this->motivo
        ]);
        
        return $newId;
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

    public function getById($id) {
    $query = "SELECT * FROM movimientos_inventario WHERE id = :id";
    $stmt = $this->db->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

public function update() {
    $this->validateRequiredFields(['id', 'tipo', 'cantidad']);
    
    // Obtener datos anteriores para auditoría
    $oldData = $this->getById($this->id);
    
    $query = "UPDATE movimientos_inventario SET 
                tipo = :tipo,
                cantidad = :cantidad,
                motivo = :motivo
              WHERE id = :id";
    
    $stmt = $this->db->prepare($query);
    $stmt->bindParam(':tipo', $this->tipo);
    $stmt->bindParam(':cantidad', $this->cantidad, PDO::PARAM_INT);
    $stmt->bindParam(':motivo', $this->motivo);
    $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
    
    if(!$stmt->execute()) {
        throw new Exception("Error al actualizar movimiento");
    }
    
    // Registrar auditoría
    Audit::log('movimientos_inventario', $this->id, 'editar', $oldData, [
        'tipo' => $this->tipo,
        'cantidad' => $this->cantidad,
        'motivo' => $this->motivo
    ]);
    
    return true;
}

    public function delete() {
        $this->validateRequiredFields(['id']);
        
        // Obtener datos anteriores para auditoría
        $oldData = $this->getById($this->id);
        
        $query = "DELETE FROM movimientos_inventario WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
        
        if(!$stmt->execute()) {
            throw new Exception("Error al eliminar movimiento");
        }
        
        // Registrar auditoría
        Audit::log('movimientos_inventario', $this->id, 'eliminar', $oldData, null);
        
        return true;
    }

    /**
     * Verificar si un movimiento es el último de su producto
     */
    public function isLastMovementForProduct($movimiento_id) {
        $movement = $this->getById($movimiento_id);
        if (!$movement) return false;
        
        $query = "SELECT id FROM movimientos_inventario 
                  WHERE producto_id = :producto_id 
                  ORDER BY created_at DESC, id DESC 
                  LIMIT 1";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':producto_id', $movement['producto_id'], PDO::PARAM_INT);
        $stmt->execute();
        $last = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $last && $last['id'] == $movimiento_id;
    }

    public function getRecent($limit = 10) {
    $query = "SELECT m.*, p.nombre as producto_nombre 
              FROM movimientos_inventario m
              LEFT JOIN productos p ON m.producto_id = p.id
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