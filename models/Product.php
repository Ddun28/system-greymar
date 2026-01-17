<?php
require_once '../config/database.php';
require_once '../models/Audit.php';

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
    public $precio;
    public $stock_minimo;
    public $creado_por;
    public $actualizado_por;
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
                     stock = :stock,
                     precio = :precio,
                     stock_minimo = :stock_minimo,
                     creado_por = :creado_por";

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':descripcion', $this->descripcion);
        $stmt->bindParam(':imagen', $this->imagen);
        $stmt->bindParam(':categoria_id', $this->categoria_id, PDO::PARAM_INT);
        $stmt->bindParam(':stock', $this->stock, PDO::PARAM_INT);
        $stmt->bindParam(':precio', $this->precio);
        $stmt->bindParam(':stock_minimo', $this->stock_minimo, PDO::PARAM_INT);
        $stmt->bindParam(':creado_por', $this->creado_por, PDO::PARAM_INT);

        if(!$stmt->execute()) {
            throw new Exception("Error al crear producto");
        }
        
        $newId = $this->db->lastInsertId();
        
        // Registrar auditoría
        Audit::log('productos', $newId, 'crear', null, [
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'categoria_id' => $this->categoria_id,
            'stock' => $this->stock,
            'precio' => $this->precio,
            'stock_minimo' => $this->stock_minimo
        ]);
        
        return $newId;
    }

    public function update() {
        $this->validateRequiredFields(['id', 'nombre', 'categoria_id']);
        
        // Obtener datos anteriores para auditoría
        $oldData = $this->getById($this->id);
        
        $query = "UPDATE $this->table 
                 SET nombre = :nombre,
                     descripcion = :descripcion,
                     imagen = :imagen,
                     categoria_id = :categoria_id,
                     stock = :stock,
                     precio = :precio,
                     stock_minimo = :stock_minimo,
                     actualizado_por = :actualizado_por
                 WHERE id = :id";

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':descripcion', $this->descripcion);
        $stmt->bindParam(':imagen', $this->imagen);
        $stmt->bindParam(':categoria_id', $this->categoria_id, PDO::PARAM_INT);
        $stmt->bindParam(':stock', $this->stock, PDO::PARAM_INT);
        $stmt->bindParam(':precio', $this->precio);
        $stmt->bindParam(':stock_minimo', $this->stock_minimo, PDO::PARAM_INT);
        $stmt->bindParam(':actualizado_por', $this->actualizado_por, PDO::PARAM_INT);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        if(!$stmt->execute()) {
            throw new Exception("Error al actualizar producto");
        }
        
        // Registrar auditoría
        Audit::log('productos', $this->id, 'editar', $oldData, [
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'categoria_id' => $this->categoria_id,
            'stock' => $this->stock,
            'precio' => $this->precio,
            'stock_minimo' => $this->stock_minimo
        ]);
        
        return true;
    }

    public function getById($id) {
        $query = "SELECT * FROM $this->table WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function delete() {
        $this->validateRequiredFields(['id']);
        
        // Obtener datos para auditoría antes de eliminar
        $oldData = $this->getById($this->id);
        
        $query = "DELETE FROM $this->table WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        if(!$stmt->execute()) {
            throw new Exception("Error al eliminar producto");
        }
        
        // Registrar auditoría
        Audit::log('productos', $this->id, 'eliminar', $oldData, null);
        
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

            $newMovementId = $this->db->lastInsertId();

            // Registrar auditoría del movimiento creado
            Audit::log('movimientos_inventario', $newMovementId, 'crear', null, [
                'producto_id' => $this->id,
                'tipo' => $tipo,
                'cantidad' => $cantidad,
                'motivo' => $motivo
            ]);

            $this->db->commit();
            return $newMovementId;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw new Exception("Error en movimiento de inventario: " . $e->getMessage());
        }
    }

    /**
     * Obtener productos con stock crítico (stock <= stock_minimo)
     */
    public function getLowStockProducts() {
        $query = "SELECT p.*, c.nombre as categoria 
                  FROM $this->table p
                  LEFT JOIN categorias c ON p.categoria_id = c.id
                  WHERE p.stock <= p.stock_minimo
                  ORDER BY (p.stock_minimo - p.stock) DESC, p.nombre ASC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtener el último movimiento de un producto
     */
    public function getLastMovement($producto_id) {
        $query = "SELECT * FROM $this->movementsTable 
                  WHERE producto_id = :producto_id 
                  ORDER BY created_at DESC, id DESC 
                  LIMIT 1";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':producto_id', $producto_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
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