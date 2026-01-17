<?php
/**
 * scripts/generate_sql.php
 * Genera un archivo SQL que crea la base de datos, aplica las migraciones
 * y añade un usuario administrador con contraseña '123456' (hasheada).
 * Ejecutar desde CLI: php scripts/generate_sql.php
 */

$host = '127.0.0.1';
$dbname = 'proyecto_3er_trayecto';
$charset = 'utf8mb4';

$outFile = __DIR__ . '/generated_setup.sql';

// Leer migraciones
$migrationsFile = __DIR__ . '/../database/migrations.sql';
if (!is_readable($migrationsFile)) {
    fwrite(STDERR, "No se puede leer $migrationsFile\n");
    exit(1);
}

$migrations = file_get_contents($migrationsFile);

// Generar hash de la contraseña admin
$adminPlain = '123456';
$adminHash = password_hash($adminPlain, PASSWORD_DEFAULT, ['cost' => 12]);

$baseTables = "-- Tablas base requeridas por la aplicación\n\n";

$baseTables .= "CREATE TABLE IF NOT EXISTS usuarios (\n";
$baseTables .= "  id INT AUTO_INCREMENT PRIMARY KEY,\n";
$baseTables .= "  nombre VARCHAR(100) NOT NULL,\n";
$baseTables .= "  apellido VARCHAR(100) NOT NULL,\n";
$baseTables .= "  correo VARCHAR(150) NOT NULL UNIQUE,\n";
$baseTables .= "  usuario VARCHAR(100) NOT NULL UNIQUE,\n";
$baseTables .= "  password VARCHAR(255) NOT NULL,\n";
$baseTables .= "  cargo VARCHAR(50) NOT NULL,\n";
$baseTables .= "  creado_por INT NULL,\n";
$baseTables .= "  actualizado_por INT NULL,\n";
$baseTables .= "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n";
$baseTables .= ") ENGINE=InnoDB DEFAULT CHARSET=$charset COLLATE=${charset}_unicode_ci;\n\n";

$baseTables .= "CREATE TABLE IF NOT EXISTS categorias (\n";
$baseTables .= "  id INT AUTO_INCREMENT PRIMARY KEY,\n";
$baseTables .= "  nombre VARCHAR(150) NOT NULL,\n";
$baseTables .= "  descripcion TEXT NULL,\n";
$baseTables .= "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n";
$baseTables .= ") ENGINE=InnoDB DEFAULT CHARSET=$charset COLLATE=${charset}_unicode_ci;\n\n";

$baseTables .= "CREATE TABLE IF NOT EXISTS productos (\n";
$baseTables .= "  id INT AUTO_INCREMENT PRIMARY KEY,\n";
$baseTables .= "  nombre VARCHAR(200) NOT NULL,\n";
$baseTables .= "  descripcion TEXT NULL,\n";
$baseTables .= "  imagen VARCHAR(255) NULL,\n";
$baseTables .= "  categoria_id INT NULL,\n";
$baseTables .= "  stock INT DEFAULT 0,\n";
$baseTables .= "  precio DECIMAL(10,2) DEFAULT 0.00,\n";
$baseTables .= "  stock_minimo INT DEFAULT 5,\n";
$baseTables .= "  creado_por INT NULL,\n";
$baseTables .= "  actualizado_por INT NULL,\n";
$baseTables .= "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n";
$baseTables .= "  CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL\n";
$baseTables .= ") ENGINE=InnoDB DEFAULT CHARSET=$charset COLLATE=${charset}_unicode_ci;\n\n";

$baseTables .= "CREATE TABLE IF NOT EXISTS movimientos_inventario (\n";
$baseTables .= "  id INT AUTO_INCREMENT PRIMARY KEY,\n";
$baseTables .= "  producto_id INT NOT NULL,\n";
$baseTables .= "  tipo VARCHAR(20) NOT NULL,\n";
$baseTables .= "  cantidad INT NOT NULL,\n";
$baseTables .= "  motivo VARCHAR(255) NULL,\n";
$baseTables .= "  usuario_id INT NULL,\n";
$baseTables .= "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n";
$baseTables .= "  CONSTRAINT fk_movimiento_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE\n";
$baseTables .= ") ENGINE=InnoDB DEFAULT CHARSET=$charset COLLATE=${charset}_unicode_ci;\n\n";

$baseTables .= "CREATE TABLE IF NOT EXISTS auditoria (\n";
$baseTables .= "  id INT AUTO_INCREMENT PRIMARY KEY,\n";
$baseTables .= "  tabla VARCHAR(50) NOT NULL,\n";
$baseTables .= "  registro_id INT NOT NULL,\n";
$baseTables .= "  accion ENUM('crear','editar','eliminar') NOT NULL,\n";
$baseTables .= "  usuario_id INT NULL,\n";
$baseTables .= "  usuario_nombre VARCHAR(100) NULL,\n";
$baseTables .= "  datos_anteriores JSON NULL,\n";
$baseTables .= "  datos_nuevos JSON NULL,\n";
$baseTables .= "  ip_address VARCHAR(45) NULL,\n";
$baseTables .= "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n";
$baseTables .= ") ENGINE=InnoDB DEFAULT CHARSET=$charset COLLATE=${charset}_unicode_ci;\n\n";

$adminInsert = "-- Insertar usuario administrador (usuario='admin' contraseña='123456')\n";
$adminInsert .= "INSERT IGNORE INTO usuarios (nombre, apellido, correo, usuario, password, cargo, created_at) VALUES ('Admin', 'User', 'admin@local', 'admin', '" . addslashes($adminHash) . "', 'admin', NOW());\n\n";

$sql = "-- Generado por scripts/generate_sql.php\n";
$sql .= "CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET $charset COLLATE ${charset}_unicode_ci;\n";
$sql .= "USE `$dbname`;\n\n";

// Añadir tablas base primero
$sql .= $baseTables . "\n";

$sql .= "-- Migraciones originales\n" . $migrations . "\n\n";

$sql .= $adminInsert;

if (file_put_contents($outFile, $sql) === false) {
    fwrite(STDERR, "Error escribiendo $outFile\n");
    exit(1);
}

echo "Archivo SQL generado: $outFile\n";
exit(0);
