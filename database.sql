-- =====================================================================
-- database.sql  (TP N5 - Distribuidora)
-- Estructura y datos de ejemplo de la base "distribuidora".
--
-- La estructura equivale a las migraciones de Prisma generadas a partir de
-- prisma/schema.prisma:
--   * 20261019135355_inicial     -> tablas, claves y restricciones
--   * 20261020230000_baja_logica -> columna "activo" en proveedores, clientes
--                                   y empleados (baja logica en vez de DELETE).
--   * 20261124143357_ampliacion_campos_y_baja_companias
--                                -> localidad, provincia, codigo_postal y
--                                   fecha_alta en clientes y proveedores;
--                                   localidad, provincia, fecha_nacimiento y
--                                   fecha_alta en empleados; categoria en
--                                   productos; "activo" en companias_envio.
--   * 20261128122451_comprobante_factura_a
--                                -> condicion_iva en clientes; tablas
--                                   "comprobantes" (factura tipo A emitida
--                                   para un pedido) y "emisor" (datos de la
--                                   distribuidora, una sola fila).
-- Las reglas de valores (precio > 0, stock >= 0, cantidad > 0) se validan
-- desde el backend, en los controllers.
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

-- Proveedores: quienes abastecen los productos. CUIL/CUIT unico. activo = baja logica.
CREATE TABLE `proveedores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `email` VARCHAR(100) NOT NULL,
    `direccion` VARCHAR(150) NULL,
    `CUIL_CUIT` VARCHAR(20) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `codigo_postal` VARCHAR(10) NULL,
    `fecha_alta` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `localidad` VARCHAR(100) NULL,
    `provincia` VARCHAR(100) NULL,

    UNIQUE INDEX `uq_proveedores_cuit`(`CUIL_CUIT`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Clientes: quienes realizan pedidos. CUIL/CUIT unico. activo = baja logica.
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `email` VARCHAR(100) NOT NULL,
    `direccion` VARCHAR(150) NULL,
    `CUIL_CUIT` VARCHAR(20) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `codigo_postal` VARCHAR(10) NULL,
    `fecha_alta` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `localidad` VARCHAR(100) NULL,
    `provincia` VARCHAR(100) NULL,
    `condicion_iva` ENUM('responsable_inscripto', 'monotributista', 'exento', 'consumidor_final') NULL,

    UNIQUE INDEX `uq_clientes_cuit`(`CUIL_CUIT`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Empleados: quienes gestionan los pedidos. Email unico. activo = baja logica.
CREATE TABLE `empleados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `cargo` VARCHAR(50) NULL,
    `email` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fecha_alta` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_nacimiento` DATE NULL,
    `localidad` VARCHAR(100) NULL,
    `provincia` VARCHAR(100) NULL,

    UNIQUE INDEX `uq_empleados_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Companias de envio: transportistas de los pedidos. activo = baja logica.
CREATE TABLE `companias_envio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Productos: cada uno pertenece a un proveedor.
CREATE TABLE `productos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `id_proveedor` INTEGER NOT NULL,
    `categoria` VARCHAR(50) NULL,

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

-- Comprobantes: factura emitida para un pedido (maximo una por pedido). El numero no se repite.
CREATE TABLE `comprobantes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pedido` INTEGER NOT NULL,
    `tipo` ENUM('A') NOT NULL DEFAULT 'A',
    `punto_venta` INTEGER NOT NULL,
    `numero` INTEGER NOT NULL,
    `fecha_emision` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `comprobantes_id_pedido_key`(`id_pedido`),
    UNIQUE INDEX `uq_comprobantes_numero`(`tipo`, `punto_venta`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Emisor: datos de la distribuidora que emite las facturas. Tiene una sola fila (id = 1).
CREATE TABLE `emisor` (
    `id` INTEGER NOT NULL,
    `razon_social` VARCHAR(100) NOT NULL,
    `cuit` VARCHAR(20) NOT NULL,
    `domicilio` VARCHAR(150) NOT NULL,
    `ingresos_brutos` VARCHAR(20) NULL,
    `inicio_actividades` DATE NOT NULL,
    `punto_venta` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
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
ALTER TABLE `comprobantes` ADD CONSTRAINT `comprobantes_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- ---------------------------------------------------------------------
-- DATOS DE EJEMPLO
-- ---------------------------------------------------------------------
INSERT INTO proveedores (nombre, telefono, email, direccion, localidad, provincia, codigo_postal, CUIL_CUIT, fecha_alta) VALUES
('Distribuidora Andina', '2994111111', 'ventas@andina.example', 'Calle Mitre 123', 'Neuquen', 'Neuquen', '8300', '30-71234567-1', '2023-02-10'),
('Alimentos del Valle', '2994222222', 'contacto@valle.example', 'Av. Roca 456', 'General Roca', 'Rio Negro', '8332', '30-71234568-2', '2023-06-15'),
('Bebidas del Sur', '2994333333', 'info@sur.example', 'Ruta 22 km 10', 'Cipolletti', 'Rio Negro', '8324', '30-71234569-3', '2024-01-20');

INSERT INTO clientes (nombre, telefono, email, direccion, localidad, provincia, codigo_postal, CUIL_CUIT, condicion_iva, fecha_alta) VALUES
('Kiosco Don Pepe', '2994444444', 'pepe@kiosco.example', 'Calle Belgrano 10', 'Neuquen', 'Neuquen', '8300', '20-30123456-4', 'monotributista', '2024-03-05'),
('Almacen La Esquina', '2994555555', 'laesquina@almacen.example', 'Calle Sarmiento 25', 'Cipolletti', 'Rio Negro', '8324', '20-30123457-5', 'monotributista', '2024-07-12'),
('Supermercado Central', '2994666666', 'compras@central.example', 'Av. San Martin 300', 'General Roca', 'Rio Negro', '8332', '30-71234570-6', 'responsable_inscripto', '2025-02-18');

INSERT INTO empleados (nombre, apellido, cargo, email, localidad, provincia, fecha_nacimiento, fecha_alta) VALUES
('Laura', 'Gomez', 'Vendedora', 'laura@distribuidora.example', 'Neuquen', 'Neuquen', '1992-04-18', '2022-03-01'),
('Marcos', 'Diaz', 'Encargado de deposito', 'marcos@distribuidora.example', 'Cipolletti', 'Rio Negro', '1987-11-02', '2021-08-16');

INSERT INTO companias_envio (nombre, telefono) VALUES
('Envios Rapidos', '2994777777'),
('Logistica Patagonia', '2994888888');

-- Los productos 3 y 4 tienen stock bajo, util para probar el filtro por stock maximo.
INSERT INTO productos (nombre, categoria, precio, stock, id_proveedor) VALUES
('Gaseosa cola 2 L', 'Bebidas', 1850.50, 120, 3),
('Agua mineral 1,5 L', 'Bebidas', 900.00, 300, 3),
('Jugo de naranja 1 L', 'Bebidas', 1200.00, 40, 2),
('Galletitas surtidas', 'Almacen', 650.00, 25, 1),
('Aceite de girasol 900 ml', 'Almacen', 2100.00, 80, 2);

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

-- Emisor de las facturas (datos ficticios). Es la unica fila de la tabla.
INSERT INTO emisor (id, razon_social, cuit, domicilio, ingresos_brutos, inicio_actividades, punto_venta) VALUES
(1, 'Distribuidora del Valle S.R.L.', '30-12345678-1', 'Av. Argentina 1234, Neuquen, Neuquen (8300)', '901-123456-7', '2015-03-01', 1);