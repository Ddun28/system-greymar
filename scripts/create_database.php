<?php
/**
 * scripts/create_database.php
 * Crea la base de datos `proyecto_3er_trayecto` e importa `database/migrations.sql`.
 * Ejecutar desde CLI: php scripts/create_database.php
 */

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$dbname = 'proyecto_3er_trayecto';
$charset = 'utf8mb4';

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO("mysql:host=$host;charset=$charset", $user, $pass, $options);
    echo "Conectado a MySQL en $host\n";

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET $charset COLLATE ${charset}_unicode_ci");
    echo "Base de datos `$dbname` creada o ya existe.\n";

    $pdo->exec("USE `$dbname`");

    $sqlFile = __DIR__ . '/../database/migrations.sql';
    if (!is_readable($sqlFile)) {
        throw new Exception("No se puede leer $sqlFile");
    }

    $sql = file_get_contents($sqlFile);
    // El archivo usa sentencias separadas por ';' en líneas nuevas. Separamos por ";\n" para evitar romper comentarios en la misma línea.
    $statements = preg_split('/;\s*\n/', $sql);

    $applied = 0;
    foreach ($statements as $stmt) {
        $stmt = trim($stmt);
        if ($stmt === '' ) continue;
        // Omitir líneas que son solo comentarios (-- ...)
        if (preg_match('/^--/', $stmt)) continue;
        try {
            $pdo->exec($stmt);
            $applied++;
        } catch (PDOException $e) {
            // Mostrar advertencia pero continuar con siguientes sentencias
            echo "Advertencia al ejecutar sentencia: " . $e->getMessage() . "\n";
        }
    }

    echo "Migraciones aplicadas (sentencias procesadas: $applied).\n";
    
        // Verificar existencia de la tabla usuarios; si no existe, crear una mínima compatible
        $stmt = $pdo->query("SHOW TABLES LIKE 'usuarios'");
        $tableExists = ($stmt->rowCount() > 0);
        if (!$tableExists) {
            echo "Tabla 'usuarios' no encontrada. Creando tabla mínima 'usuarios'.\n";
            $createUsers = "CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                apellido VARCHAR(100) NOT NULL,
                correo VARCHAR(150) NOT NULL UNIQUE,
                usuario VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                cargo VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
            try {
                $pdo->exec($createUsers);
                echo "Tabla 'usuarios' creada.\n";
            } catch (PDOException $e) {
                echo "Error al crear tabla 'usuarios': " . $e->getMessage() . "\n";
            }
        } else {
            echo "Tabla 'usuarios' existe.\n";
        }
    
        // Crear usuario admin si no existe
        $checkAdmin = $pdo->prepare("SELECT id FROM usuarios WHERE usuario = :usuario OR correo = :correo LIMIT 1");
        $adminUser = 'admin';
        $adminEmail = 'admin@local';
        $checkAdmin->execute([':usuario' => $adminUser, ':correo' => $adminEmail]);
        if ($checkAdmin->rowCount() === 0) {
            $passwordPlain = '123456';
            $passwordHash = password_hash($passwordPlain, PASSWORD_DEFAULT, ['cost' => 12]);
            $insert = $pdo->prepare("INSERT INTO usuarios (nombre, apellido, correo, usuario, password, cargo) VALUES (:nombre, :apellido, :correo, :usuario, :password, :cargo)");
            try {
                $insert->execute([
                    ':nombre' => 'Admin',
                    ':apellido' => 'User',
                    ':correo' => $adminEmail,
                    ':usuario' => $adminUser,
                    ':password' => $passwordHash,
                    ':cargo' => 'admin'
                ]);
                echo "Usuario administrador creado: usuario='admin' contraseña='123456'\n";
            } catch (PDOException $e) {
                echo "Error al crear usuario admin: " . $e->getMessage() . "\n";
            }
        } else {
            echo "Usuario administrador ya existe.\n";
        }
    
        exit(0);

} catch (PDOException $e) {
    fwrite(STDERR, "PDO Error: " . $e->getMessage() . "\n");
    exit(1);
} catch (Exception $e) {
    fwrite(STDERR, "Error: " . $e->getMessage() . "\n");
    exit(1);
}
