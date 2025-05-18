<?php
require_once '../config/database.php';

class Category {
    private $db;
    private $table = 'categorias';

    // Columnas
    public $id;
    public $nombre;
    public $descripcion;
    public $created_at;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create() {
        $this->validateRequiredFields(['nombre']);
        
        $query = 'INSERT INTO ' . $this->table . '
            SET nombre = :nombre,
                descripcion = :descripcion';

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':descripcion', $this->descripcion);

        if(!$stmt->execute()) {
            throw new Exception("Error al crear categoría");
        }
        
        return true;
    }

    public function update() {
        $this->validateRequiredFields(['id', 'nombre']);
        
        $query = 'UPDATE ' . $this->table . '
            SET nombre = :nombre,
                descripcion = :descripcion
            WHERE id = :id';

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':descripcion', $this->descripcion);
        $stmt->bindParam(':id', $this->id);

        if(!$stmt->execute()) {
            throw new Exception("Error al actualizar categoría");
        }
        
        return true;
    }

    public function delete() {
        $this->validateRequiredFields(['id']);
        
        $query = 'DELETE FROM ' . $this->table . ' WHERE id = :id';
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $this->id);

        if(!$stmt->execute()) {
            throw new Exception("Error al eliminar categoría");
        }
        
        return true;
    }

    public function read() {
        $query = 'SELECT id, nombre, descripcion, created_at FROM ' . $this->table;
        
        if(!empty($this->id)) {
            $query .= ' WHERE id = :id';
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
        } else {
            $stmt = $this->db->prepare($query);
        }
        
        if(!$stmt->execute()) {
            throw new Exception("Error al obtener categorías");
        }
        
        return $stmt;
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