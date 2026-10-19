-- =====================================================================
-- database.sql  (TP N5 - Distribuidora)
-- Estructura y datos de ejemplo de la base "distribuidora".
--
-- La estructura se genero con Prisma Migrate a partir de prisma/schema.prisma
-- (migracion prisma/migrations/20261019135355_inicial) y se le agregaron a mano
-- las restricciones CHECK, que Prisma no declara en el schema.
--
-- ATENCION: el script BORRA la base "distribuidora" si ya existe y la crea de nuevo.
-- Para trabajar con Prisma se usan las migraciones (npx prisma migrate dev);
-- este archivo es una copia equivalente para crear la base directamente en SQL.
-- =====================================================================

DROP DATABASE IF EXISTS distribuidora;
CREATE DATABASE distribuidora DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE distribuidora;

-- ---------------------------------------------------------------------
-- TABLAS
-- ---------------------------------------------------------------------

-- Proveedores: quienes abastecen los productos. CUIL/CUIT unico.
CREATE TABLE `proveedores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `email` VARCHAR(100) NOT NULL,
    `direccion` VARCHAR(150) NULL,
    `CUIL_CUIT` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `uq_proveedores_cuit`(`CUIL_CUIT`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Clientes: quienes realizan pedidos. CUIL/CUIT unico.
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `email` VARCHAR(100) NOT NULL,
    `direccion` VARCHAR(150) NULL,
    `CUIL_CUIT` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `uq_clientes_cuit`(`CUIL_CUIT`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Empleados: quienes gestionan los pedidos. Email unico.
CREATE TABLE `empleados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `cargo` VARCHAR(50) NULL,
    `email` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `uq_empleados_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Companias de envio: transportistas de los pedidos.
CREATE TABLE `companias_envio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(20) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Productos: cada uno pertenece a un proveedor.
CREATE TABLE `productos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `id_proveedor` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Pedidos: pertenecen a un cliente, un empleado y una compania de envio.
CREATE TABLE `pedidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `estado` ENUM('pendiente', 'enviado', 'entregado') NOT NULL DEFAULT 'pendiente',
    `id_cliente` INTEGER NOT NULL,
    `id_empleado` INTEGER NOT NULL,
    `id_compania_envio` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Detalle del pedido: lineas (producto + cantidad). PK compuesta.
CREATE TABLE `detalle_pedido` (
    `id_pedido` INTEGER NOT NULL,
    `id_producto` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id_pedido`, `id_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- CLAVES FORANEAS (ON DELETE RESTRICT; CASCADE solo en detalle_pedido -> pedidos)
-- ---------------------------------------------------------------------

ALTER TABLE `productos` ADD CONSTRAINT `productos_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_id_empleado_fkey` FOREIGN KEY (`id_empleado`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_id_compania_envio_fkey` FOREIGN KEY (`id_compania_envio`) REFERENCES `companias_envio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `detalle_pedido` ADD CONSTRAINT `detalle_pedido_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `detalle_pedido` ADD CONSTRAINT `detalle_pedido_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- ---------------------------------------------------------------------
-- RESTRICCIONES CHECK (requieren MariaDB 10.2+ o MySQL 8.0.16+)
-- ---------------------------------------------------------------------
ALTER TABLE `productos` ADD CONSTRAINT `ck_productos_precio` CHECK (`precio` >= 0);
ALTER TABLE `productos` ADD CONSTRAINT `ck_productos_stock` CHECK (`stock` >= 0);
ALTER TABLE `detalle_pedido` ADD CONSTRAINT `ck_detalle_cantidad` CHECK (`cantidad` > 0);
ALTER TABLE `detalle_pedido` ADD CONSTRAINT `ck_detalle_precio` CHECK (`precio_unitario` >= 0);


-- ---------------------------------------------------------------------
-- DATOS DE EJEMPLO
-- ---------------------------------------------------------------------
INSERT INTO proveedores (nombre, telefono, email, direccion, CUIL_CUIT) VALUES
('Distribuidora Andina', '2994111111', 'ventas@andina.example', 'Calle Mitre 123', '30-71234567-1'),
('Alimentos del Valle', '2994222222', 'contacto@valle.example', 'Av. Roca 456', '30-71234568-2'),
('Bebidas del Sur', '2994333333', 'info@sur.example', 'Ruta 22 km 10', '30-71234569-3');

INSERT INTO clientes (nombre,telefono, email, direccion, CUIL_CUIT) VALUES
('Kiosco Don Pepe', '2994444444', 'pepe@kiosco.example', 'Calle Belgrano 10', '20-30123456-4'),
('Almacen La Esquina', '2994555555', 'laesquina@almacen.example', 'Calle Sarmiento 25', '20-30123457-5'),
('Supermercado Central', '2994666666', 'compras@central.example', 'Av. San Martin 300', '30-71234570-6');

INSERT INTO empleados (nombre, apellido, cargo, email) VALUES
('Laura', 'Gomez', 'Vendedora', 'laura@distribuidora.example'),
('Marcos', 'Diaz', 'Encargado de deposito', 'marcos@distribuidora.example');

INSERT INTO companias_envio (nombre, telefono) VALUES
('Envios Rapidos', '2994777777'),
('Logistica Patagonia', '2994888888');

-- Los productos 3 y 4 tienen stock bajo, util para probar el filtro por stock maximo.
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