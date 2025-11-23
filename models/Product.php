<?php
require_once '../config/database.php';

class Product {
    private $db;
    private $table = 'productos';
    // Use the canonical inventory movements table
    private $movementsTable = 'movimientos_inventario';

    public $id;
    public $nombre;
    public $descripcion;
    public $imagen;
    public $categoria_id;
    public $stock;
    public $created_at;

    public function __construct() {
        $this->db = Database::getInstance();
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

    public function create() {
        $this->validateRequiredFields(['nombre', 'categoria_id', 'stock']);
        
        $query = "INSERT INTO $this->table 
                 SET nombre = :nombre,
                     descripcion = :descripcion,
                     imagen = :imagen,
                     categoria_id = :categoria_id,
                     stock = :stock";

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':descripcion', $this->descripcion);
        $stmt->bindParam(':imagen', $this->imagen);
        $stmt->bindParam(':categoria_id', $this->categoria_id, PDO::PARAM_INT);
        $stmt->bindParam(':stock', $this->stock, PDO::PARAM_INT);

        if(!$stmt->execute()) {
            throw new Exception("Error al crear producto");
        }
        
        return $this->db->lastInsertId();
    }

    public function update() {
        $this->validateRequiredFields(['id', 'nombre', 'categoria_id']);
        
        $query = "UPDATE $this->table 
                 SET nombre = :nombre,
                     descripcion = :descripcion,
                     imagen = :imagen,
                     categoria_id = :categoria_id,
                     stock = :stock
                 WHERE id = :id";

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':descripcion', $this->descripcion);
        $stmt->bindParam(':imagen', $this->imagen);
        $stmt->bindParam(':categoria_id', $this->categoria_id, PDO::PARAM_INT);
        $stmt->bindParam(':stock', $this->stock, PDO::PARAM_INT);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        if(!$stmt->execute()) {
            throw new Exception("Error al actualizar producto");
        }
        
        return true;
    }

    public function delete() {
        $this->validateRequiredFields(['id']);
        
        $query = "DELETE FROM $this->table WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        if(!$stmt->execute()) {
            throw new Exception("Error al eliminar producto");
        }
        
        return true;
    }

    public function read() {
        $query = "SELECT p.*, c.nombre as categoria 
                 FROM $this->table p
                 LEFT JOIN categorias c ON p.categoria_id = c.id";
        
        if(!empty($this->id)) {
            $query .= " WHERE p.id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
        } else {
            $stmt = $this->db->prepare($query);
        }
        
        if(!$stmt->execute()) {
            throw new Exception("Error al obtener productos");
        }
        
        return $stmt;
    }

    public function registerMovement($tipo, $cantidad, $motivo = null) {
        $this->validateRequiredFields(['id']);
        
        $this->db->beginTransaction();
        try {
            // Actualizar stock
            $newStock = $tipo === 'entrada' 
                ? $this->stock + $cantidad 
                : $this->stock - $cantidad;
            
            $query = "UPDATE $this->table SET stock = :stock WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':stock', $newStock, PDO::PARAM_INT);
            $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
            $stmt->execute();
            
            // Registrar movimiento
            $query = "INSERT INTO $this->movementsTable 
                     SET producto_id = :producto_id,
                         tipo = :tipo,
                         cantidad = :cantidad,
                         motivo = :motivo";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':producto_id', $this->id, PDO::PARAM_INT);
            $stmt->bindParam(':tipo', $tipo);
            $stmt->bindParam(':cantidad', $cantidad, PDO::PARAM_INT);
            $stmt->bindParam(':motivo', $motivo);
            $stmt->execute();
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw new Exception("Error en movimiento de inventario: " . $e->getMessage());
        }
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