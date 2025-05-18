<?php
require_once '../config/database.php';

class User {
    private $db;
    private $table = 'usuarios';
    private $allowedRoles = ['admin', 'empleado', 'inventario'];

    // Columnas de la tabla
    public $id;
    public $nombre;
    public $apellido;
    public $correo;
    public $usuario;
    public $password;
    public $created_at;
    public $cargo;

    public function __construct() {
         $this->db = Database::getInstance();
    }

    // Crear usuario
    public function create() {
        $this->validateRequiredFields(['nombre', 'apellido', 'correo', 'usuario', 'password', 'cargo']);
        $this->validateEmail();
        $this->validateRole();
        $this->checkUniqueCredentials();

        $query = 'INSERT INTO ' . $this->table . '
            SET nombre = :nombre,
                apellido = :apellido,
                correo = :correo,
                usuario = :usuario,
                cargo = :cargo,
                password = :password';

        $stmt = $this->db->prepare($query);
        
        // Hashear contraseña con opciones seguras
        $this->password = password_hash($this->password, PASSWORD_DEFAULT, ['cost' => 12]);
        
        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':apellido', $this->apellido);
        $stmt->bindParam(':correo', $this->correo);
        $stmt->bindParam(':usuario', $this->usuario);
        $stmt->bindParam(':cargo', $this->cargo);
        $stmt->bindParam(':password', $this->password);

        if(!$stmt->execute()) {
            $this->logError($stmt->errorInfo());
            throw new Exception("Error al crear usuario");
        }
        
        $this->logAction("Usuario creado: " . $this->usuario);
        return true;
    }

    // Actualizar usuario
    public function update() {
        $this->validateRequiredFields(['id', 'nombre', 'apellido', 'correo', 'usuario', 'cargo']);
        $this->validateEmail();
        $this->validateRole();
        $this->checkExists();

        $query = 'UPDATE ' . $this->table . '
            SET nombre = :nombre,
                apellido = :apellido,
                correo = :correo,
                usuario = :usuario,
                cargo = :cargo
            WHERE id = :id';

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':apellido', $this->apellido);
        $stmt->bindParam(':correo', $this->correo);
        $stmt->bindParam(':usuario', $this->usuario);
        $stmt->bindParam(':cargo', $this->cargo);
        $stmt->bindParam(':id', $this->id);

        if(!$stmt->execute()) {
            $this->logError($stmt->errorInfo());
            throw new Exception("Error al actualizar usuario");
        }
        
        $this->logAction("Usuario actualizado ID: " . $this->id);
        return true;
    }

    // Eliminar usuario
    public function delete() {
        $this->validateRequiredFields(['id']);
        $this->checkExists();

        $query = 'DELETE FROM ' . $this->table . ' WHERE id = :id';
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $this->id);

        if(!$stmt->execute()) {
            $this->logError($stmt->errorInfo());
            throw new Exception("Error al eliminar usuario");
        }
        
        $this->logAction("Usuario eliminado ID: " . $this->id);
        return true;
    }

    // Obtener todos los usuarios (solo datos necesarios)
    public function read() {
    $query = 'SELECT id, nombre, apellido, correo, usuario, cargo, created_at 
            FROM ' . $this->table;

    // Añadir WHERE si hay un ID
    if (!empty($this->id)) {
        $query .= ' WHERE id = :id';
    }

    $stmt = $this->db->prepare($query);
    
    // Vincular el parámetro :id si existe
    if (!empty($this->id)) {
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
    }
    
    if(!$stmt->execute()) {
        $this->logError($stmt->errorInfo());
        throw new Exception("Error al obtener usuarios");
    }
    
    return $stmt;
}

    public function getByUsername($username) {
    $query = "SELECT * FROM usuarios WHERE usuario = ?";
    $stmt = $this->db->prepare($query);
    $stmt->execute([$username]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

    /********************
     * Métodos de Validación
     ********************/
    
    private function validateRequiredFields($fields) {
        foreach ($fields as $field) {
            if (empty($this->$field)) {
                throw new Exception("El campo $field es requerido");
            }
        }
    }

    private function validateEmail() {
        if (!filter_var($this->correo, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Formato de correo inválido");
        }
    }

    private function validateRole() {
        if (!in_array($this->cargo, $this->allowedRoles)) {
            throw new Exception("Rol de usuario inválido");
        }
    }

    private function checkUniqueCredentials() {
        $stmt = $this->db->prepare("SELECT id FROM {$this->table} 
                                  WHERE usuario = ? OR correo = ?");
        $stmt->execute([$this->usuario, $this->correo]);
        
        if ($stmt->rowCount() > 0) {
            throw new Exception("El usuario o correo ya está registrado");
        }
    }

    private function checkExists() {
        $stmt = $this->db->prepare("SELECT id FROM {$this->table} WHERE id = ?");
        $stmt->execute([$this->id]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception("Usuario no encontrado");
        }
    }

    /********************
     * Seguridad Adicional
     ********************/
    
    private function logError($errorInfo) {
        // Implementar logging a archivo o sistema externo
        error_log("[".date('Y-m-d H:i:s')."] Error SQL: " . json_encode($errorInfo));
    }

    private function logAction($message) {
        // Registrar acciones importantes
        error_log("[".date('Y-m-d H:i:s')."] User Action: $message");
    }

    // Prevenir inyección de propiedades
    public function __set($name, $value) {
        throw new Exception("Propiedad $name no existe en la clase User");
    }
}
?>