-- Generado por scripts/generate_sql.php
CREATE DATABASE IF NOT EXISTS `proyecto_3er_trayecto` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `proyecto_3er_trayecto`;

-- Tablas base requeridas por la aplicación

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  usuario VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  cargo VARCHAR(50) NOT NULL,
  creado_por INT NULL,
  actualizado_por INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT NULL,
  imagen VARCHAR(255) NULL,
  categoria_id INT NULL,
  stock INT DEFAULT 0,
  precio DECIMAL(10,2) DEFAULT 0.00,
  stock_minimo INT DEFAULT 5,
  creado_por INT NULL,
  actualizado_por INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  cantidad INT NOT NULL,
  motivo VARCHAR(255) NULL,
  usuario_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimiento_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tabla VARCHAR(50) NOT NULL,
  registro_id INT NOT NULL,
  accion ENUM('crear','editar','eliminar') NOT NULL,
  usuario_id INT NULL,
  usuario_nombre VARCHAR(100) NULL,
  datos_anteriores JSON NULL,
  datos_nuevos JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Migraciones originales
-- =====================================================
-- MIGRACIONES DE BASE DE DATOS - Sistema Greymar
-- Ejecutar en orden para agregar nuevas funcionalidades
-- =====================================================

-- 1. Agregar campo precio y stock_minimo a productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2) DEFAULT 0.00 AFTER stock,
ADD COLUMN IF NOT EXISTS stock_minimo INT DEFAULT 5 AFTER precio;

-- 2. Agregar campo usuario_id a movimientos para auditoría
ALTER TABLE movimientos_inventario 
ADD COLUMN IF NOT EXISTS usuario_id INT NULL AFTER motivo,
ADD CONSTRAINT fk_movimiento_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- 3. Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tabla VARCHAR(50) NOT NULL COMMENT 'Tabla afectada: productos, usuarios, movimientos_inventario',
    registro_id INT NOT NULL COMMENT 'ID del registro afectado',
    accion ENUM('crear', 'editar', 'eliminar') NOT NULL,
    usuario_id INT NULL,
    usuario_nombre VARCHAR(100) NULL COMMENT 'Nombre del usuario al momento de la acción',
    datos_anteriores JSON NULL COMMENT 'Estado previo del registro (para editar/eliminar)',
    datos_nuevos JSON NULL COMMENT 'Estado nuevo del registro (para crear/editar)',
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tabla_registro (tabla, registro_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Agregar campos de auditoría a productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS creado_por INT NULL AFTER stock_minimo,
ADD COLUMN IF NOT EXISTS actualizado_por INT NULL AFTER creado_por,
ADD CONSTRAINT fk_producto_creador FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_producto_editor FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL;

-- 5. Agregar campos de auditoría a usuarios (quién creó/editó)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS creado_por INT NULL,
ADD COLUMN IF NOT EXISTS actualizado_por INT NULL;

-- =====================================================
-- NOTA: Si alguna columna ya existe, MySQL dará error.
-- Puedes ejecutar cada ALTER por separado si es necesario.
-- =====================================================


-- Insertar usuario administrador (usuario='admin' contraseña='123456')
INSERT IGNORE INTO usuarios (nombre, apellido, correo, usuario, password, cargo, created_at) VALUES ('Admin', 'User', 'admin@local', 'admin', '$2y$12$65.jdll5wLeN8mLmbrxOzOECH82KkyyqDRMUv8GNq7QTbvA1F/C/q', 'admin', NOW());

