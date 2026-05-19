DROP DATABASE IF EXISTS poder_verde_hrm;
CREATE DATABASE poder_verde_hrm DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE poder_verde_hrm;

-- ════════════════════════════════════════════════════════════════
-- TABLA: ROLES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (nombre, descripcion) VALUES 
('Admin', 'Administrador del Sistema - Acceso Completo'),
('Empleado', 'Empleado General - Acceso Limitado');

-- ════════════════════════════════════════════════════════════════
-- TABLA: EMPLEADOS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS empleados (
  id_empleado INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  direccion TEXT,
  fecha_nacimiento DATE,
  puesto VARCHAR(100),
  departamento VARCHAR(100) DEFAULT 'General',
  salario DECIMAL(10,2) DEFAULT 0.00,
  fecha_ingreso DATE NOT NULL,
  estado ENUM('activo','inactivo','bloqueado') DEFAULT 'activo',
  id_rol INT DEFAULT 2,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE RESTRICT,
  INDEX idx_email (email),
  INDEX idx_estado (estado),
  INDEX idx_departamento (departamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- TABLA: TAREAS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tareas (
  id_tarea INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  id_empleado_asignado INT,
  fecha_creacion DATE NOT NULL,
  fecha_limite DATE,
  estado ENUM('pendiente','en_progreso','finalizada') DEFAULT 'pendiente',
  prioridad ENUM('baja','normal','alta','urgente') DEFAULT 'normal',
  categoria VARCHAR(100),
  progreso INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_empleado_asignado) REFERENCES empleados(id_empleado) ON DELETE SET NULL,
  INDEX idx_estado (estado),
  INDEX idx_fecha_limite (fecha_limite),
  INDEX idx_empleado (id_empleado_asignado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- TABLA: ASISTENCIAS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS asistencias (
  id_asistencia INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT NOT NULL,
  fecha DATE NOT NULL,
  hora_entrada TIME,
  hora_salida TIME,
  estado ENUM('puntual','retardo','falta','justificado') DEFAULT 'puntual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  UNIQUE KEY unique_asistencia (id_empleado, fecha),
  INDEX idx_fecha (fecha),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- TABLA: JUSTIFICACIONES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS justificaciones (
  id_justificacion INT AUTO_INCREMENT PRIMARY KEY,
  id_asistencia INT NOT NULL,
  motivo TEXT NOT NULL,
  archivo VARCHAR(255),
  estado ENUM('pendiente','aprobada','rechazada') DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_asistencia) REFERENCES asistencias(id_asistencia) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- TABLA: PERMISOS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS permisos (
  id_permiso INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  motivo TEXT NOT NULL,
  estado ENUM('pendiente','aprobado','rechazado') DEFAULT 'pendiente',
  fecha_solicitud DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  INDEX idx_estado (estado),
  INDEX idx_empleado (id_empleado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- TABLA: DOCUMENTOS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS documentos (
  id_documento INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT,
  nombre_archivo VARCHAR(255) NOT NULL,
  tipo_archivo VARCHAR(50),
  ruta_archivo VARCHAR(500) NOT NULL,
  tamano_bytes INT,
  fecha_subida DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  INDEX idx_empleado (id_empleado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- TABLA: NOMINA
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS nomina (
  id_nomina INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT NOT NULL,
  periodo VARCHAR(50) NOT NULL,
  salario_base DECIMAL(10,2) NOT NULL,
  bonificaciones DECIMAL(10,2) DEFAULT 0.00,
  deducciones DECIMAL(10,2) DEFAULT 0.00,
  neto DECIMAL(10,2) NOT NULL,
  estado ENUM('pendiente','procesada','pagada','anulada') DEFAULT 'pendiente',
  fecha_proceso DATE NOT NULL,
  fecha_pago DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  UNIQUE KEY unique_nomina (id_empleado, periodo),
  INDEX idx_estado (estado),
  INDEX idx_periodo (periodo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- TABLA: REPORTES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS reportes (
  id_reporte INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  datos JSON,
  generado_por INT,
  fecha_generacion DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generado_por) REFERENCES empleados(id_empleado) ON DELETE SET NULL,
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- DATOS DE PRUEBA
-- ════════════════════════════════════════════════════════════════

INSERT INTO empleados (id_empleado, nombre, apellido, email, telefono, direccion, fecha_nacimiento, puesto, departamento, salario, fecha_ingreso, id_rol, password) VALUES 
(1, 'David', 'Maqueda', 'david@poderverde.com', '1234567890', 'Querétaro', '2002-12-29', 'Administrador HR', 'RRHH', 50000.00, '2024-10-28', 1, '$2a$10$M2ayOSPX9hs6x8J7KGilBeeEKrBb0Liug.m8mrDjqFLRIfD8RVZei'),
(2, 'Elena', 'Ramírez', 'elena@poderverde.com', '4421000002', 'Querétaro', '1996-04-12', 'Analista de Operaciones', 'Operaciones', 35000.00, '2024-03-15', 2, '$2a$10$M2ayOSPX9hs6x8J7KGilBeeEKrBb0Liug.m8mrDjqFLRIfD8RVZei'),
(3, 'Carlos', 'Hernández', 'carlos@poderverde.com', '4421000003', 'Querétaro', '1992-08-20', 'Investigador Agrícola', 'I+D', 45000.00, '2024-01-10', 2, '$2a$10$M2ayOSPX9hs6x8J7KGilBeeEKrBb0Liug.m8mrDjqFLRIfD8RVZei'),
(4, 'Mariana', 'López', 'mariana@poderverde.com', '4421000004', 'Querétaro', '1998-11-03', 'Coordinadora Ambiental', 'Sostenibilidad', 40000.00, '2024-02-05', 2, '$2a$10$M2ayOSPX9hs6x8J7KGilBeeEKrBb0Liug.m8mrDjqFLRIfD8RVZei'),
(5, 'Jorge', 'Santos', 'jorge@poderverde.com', '4421000005', 'Querétaro', '1994-06-18', 'Técnico de Riego', 'Operaciones', 38000.00, '2024-04-01', 2, '$2a$10$M2ayOSPX9hs6x8J7KGilBeeEKrBb0Liug.m8mrDjqFLRIfD8RVZei'),
(6, 'Sofía', 'Nava', 'sofia@poderverde.com', '4421000006', 'Querétaro', '1997-09-09', 'Analista Logístico', 'Logística', 32000.00, '2024-05-12', 2, '$2a$10$M2ayOSPX9hs6x8J7KGilBeeEKrBb0Liug.m8mrDjqFLRIfD8RVZei'),
(7, 'Luis', 'Ortega', 'luis@poderverde.com', '4421000007', 'Querétaro', '1995-01-25', 'Especialista de Campo', 'Operaciones', 36000.00, '2024-06-03', 2, '$2a$10$M2ayOSPX9hs6x8J7KGilBeeEKrBb0Liug.m8mrDjqFLRIfD8RVZei');

INSERT INTO tareas (titulo, descripcion, id_empleado_asignado, fecha_creacion, fecha_limite, estado, prioridad, categoria, progreso) VALUES
('Muestreo de Suelo Sector Norte', 'Realizar análisis de pH y nutrientes para la rotación de cultivo.', 7, '2024-10-01', '2024-10-12', 'pendiente', 'alta', 'Investigación', 0),
('Revisión de Riego Goteo', 'Verificar sistemas de irrigación en zona sur y calibrar sensores.', 5, '2024-10-02', '2024-10-08', 'en_progreso', 'alta', 'Operaciones', 45),
('Optimización de Logística', 'Mejorar rutas de distribución para reducir huella de carbono.', 6, '2024-10-03', '2024-10-25', 'en_progreso', 'normal', 'Logística', 60),
('Auditoría Orgánica Anual', 'Revisión completa de certificaciones y procesos.', 3, '2024-09-20', '2024-10-05', 'finalizada', 'urgente', 'Proyecto Verde', 100);

INSERT INTO asistencias (id_empleado, fecha, hora_entrada, hora_salida, estado) VALUES
(2, '2024-10-01', '08:00:00', '17:00:00', 'puntual'),
(3, '2024-10-01', '08:15:00', '17:00:00', 'retardo'),
(4, '2024-10-01', '08:00:00', '17:00:00', 'puntual'),
(5, '2024-10-01', '08:00:00', '16:30:00', 'falta'),
(6, '2024-10-01', '08:00:00', '17:00:00', 'puntual');

INSERT INTO permisos (id_empleado, tipo, fecha_inicio, fecha_fin, motivo, estado, fecha_solicitud) VALUES
(2, 'Médico', '2024-10-10', '2024-10-12', 'Cita médica y recuperación', 'pendiente', '2024-10-01 14:00:00'),
(3, 'Vacaciones', '2024-11-01', '2024-11-15', 'Vacaciones anuales', 'aprobado', '2024-09-15 10:00:00'),
(4, 'Asuntos Familiares', '2024-10-05', '2024-10-05', 'Evento familiar urgente', 'rechazado', '2024-09-28 16:00:00');

INSERT INTO nomina (id_empleado, periodo, salario_base, bonificaciones, deducciones, neto, estado, fecha_proceso) VALUES
(2, 'Octubre 2024', 35000.00, 1500.00, 3500.00, 33000.00, 'pendiente', '2024-10-01'),
(3, 'Octubre 2024', 45000.00, 2500.00, 4500.00, 43000.00, 'pagada', '2024-09-30'),
(4, 'Octubre 2024', 40000.00, 2000.00, 4000.00, 38000.00, 'pendiente', '2024-10-01'),
(5, 'Octubre 2024', 38000.00, 1800.00, 3800.00, 36000.00, 'procesada', '2024-10-01'),
(6, 'Octubre 2024', 32000.00, 1200.00, 3200.00, 30000.00, 'pendiente', '2024-10-01'),
(7, 'Octubre 2024', 36000.00, 1500.00, 3600.00, 33900.00, 'pagada', '2024-09-30'),
(1, 'Octubre 2024', 50000.00, 3000.00, 5000.00, 48000.00, 'pagada', '2024-09-30');
