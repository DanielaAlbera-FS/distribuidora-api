-- =====================================================================
-- database.sql
-- Esquema y datos de ejemplo de la base de datos "distribuidora".
-- Las tablas se crean en orden de dependencia: primero las que no
-- referencian a ninguna otra y, al final, las que contienen claves foráneas.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS distribuidora;
USE distribuidora;

-- ---------------------------------------------------------------------
-- Estructura
-- ---------------------------------------------------------------------

-- Empresas que abastecen de productos a la distribuidora.
CREATE TABLE proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  direccion VARCHAR(150)
  CUIL_CUIT VARCHAR (20)
) ENGINE=InnoDB;

-- Clientes que realizan pedidos.
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  direccion VARCHAR(150), 
  CUIL_CUIT VARCHAR (20)
) ENGINE=InnoDB;

-- Personal que registra y atiende los pedidos.
CREATE TABLE empleados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  cargo VARCHAR(50),
  email VARCHAR(100)
) ENGINE=InnoDB;

-- Empresas encargadas del transporte de los pedidos.
CREATE TABLE companias_envio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20)
) ENGINE=InnoDB;

-- Productos en venta. Cada producto pertenece a un único proveedor (relación 1 a N).
CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  id_proveedor INT NOT NULL,
  FOREIGN KEY (id_proveedor) REFERENCES proveedores(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Cabecera de cada pedido (facturación).
-- Estados válidos: pendiente, enviado, entregado. La validación se realiza en la API.
CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  id_cliente INT NOT NULL,
  id_empleado INT NOT NULL,
  id_compania_envio INT NOT NULL,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON DELETE RESTRICT,
  FOREIGN KEY (id_empleado) REFERENCES empleados(id) ON DELETE RESTRICT,
  FOREIGN KEY (id_compania_envio) REFERENCES companias_envio(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabla intermedia que resuelve la relación N a N entre pedidos y productos.
-- precio_unitario conserva el precio al momento de la compra.
-- La clave primaria compuesta impide repetir un producto dentro del mismo pedido.
-- Al eliminar un pedido se eliminan sus líneas de detalle (CASCADE).
CREATE TABLE detalle_pedido (
  id_pedido INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id_pedido, id_producto),
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Datos de ejemplo
-- Se insertan en el mismo orden que las tablas. Los id se autogeneran
-- desde 1, por lo que las claves foráneas hacen referencia a ese orden.
-- ---------------------------------------------------------------------

INSERT INTO proveedores (nombre, telefono, email, direccion, CUIL_CUIT) VALUES
('Distribuidora Andina', '2994111111', 'ventas@andina.example', 'Calle Mitre 123', "1234567890-0"),
('Alimentos del Valle', '2994222222', 'contacto@valle.example', 'Av. Roca 456',"23456890-1"),
('Bebidas del Sur', '2994333333', 'info@sur.example', 'Ruta 22 km 10',"1-2345-93838");

INSERT INTO clientes (nombre,telefono, email, direccion, CUIL_CUIT) VALUES
('Kiosco Don Pepe', '2994444444', 'pepe@kiosco.example', 'Calle Belgrano 10',"1234567890-0"),
('Almacen La Esquina', '2994555555', 'laesquina@almacen.example', 'Calle Sarmiento 25',"1234567890-0"),
('Supermercado Central', '2994666666', 'compras@central.example', 'Av. San Martin 300',"1234567890-0");

INSERT INTO empleados (nombre, apellido, cargo, email) VALUES
('Laura', 'Gomez', 'Vendedora', 'laura@distribuidora.example'),
('Marcos', 'Diaz', 'Encargado de deposito', 'marcos@distribuidora.example');

INSERT INTO companias_envio (nombre, telefono) VALUES
('Envios Rapidos', '2994777777'),
('Logistica Patagonia', '2994888888');

-- Los productos 3 y 4 tienen stock bajo, útil para probar el filtro por stock máximo.
INSERT INTO productos (nombre, precio, stock, id_proveedor) VALUES
('Gaseosa cola 2 L', 1850.50, 120, 3),
('Agua mineral 1,5 L', 900.00, 300, 3),
('Jugo de naranja 1 L', 1200.00, 40, 2),
('Galletitas surtidas', 650.00, 25, 1),
('Aceite de girasol 900 ml', 2100.00, 80, 2);

INSERT INTO pedidos (fecha, estado, id_cliente, id_empleado, id_compania_envio) VALUES
('2026-10-01', 'pendiente', 1, 1, 1),
('2026-10-02', 'enviado', 2, 2, 2),
('2026-10-03', 'entregado', 1, 1, 2),
('2026-10-04', 'pendiente', 3, 2, 1);

INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES
(1, 1, 10, 1850.50),
(1, 3, 5, 1200.00),
(2, 2, 20, 900.00),
(2, 4, 3, 650.00),
(3, 1, 2, 1850.50),
(3, 5, 12, 2100.00),
(4, 3, 8, 1200.00);