-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE `empleados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `cargo` VARCHAR(50) NULL,
    `email` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `uq_empleados_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companias_envio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(20) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `id_proveedor` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `estado` ENUM('pendiente', 'enviado', 'entregado') NOT NULL DEFAULT 'pendiente',
    `id_cliente` INTEGER NOT NULL,
    `id_empleado` INTEGER NOT NULL,
    `id_compania_envio` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalle_pedido` (
    `id_pedido` INTEGER NOT NULL,
    `id_producto` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id_pedido`, `id_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_id_empleado_fkey` FOREIGN KEY (`id_empleado`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_id_compania_envio_fkey` FOREIGN KEY (`id_compania_envio`) REFERENCES `companias_envio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_pedido` ADD CONSTRAINT `detalle_pedido_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_pedido` ADD CONSTRAINT `detalle_pedido_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraints (a mano: Prisma no soporta CHECK en schema.prisma)
ALTER TABLE `productos` ADD CONSTRAINT `ck_productos_precio` CHECK (`precio` >= 0);
ALTER TABLE `productos` ADD CONSTRAINT `ck_productos_stock` CHECK (`stock` >= 0);
ALTER TABLE `detalle_pedido` ADD CONSTRAINT `ck_detalle_cantidad` CHECK (`cantidad` > 0);
ALTER TABLE `detalle_pedido` ADD CONSTRAINT `ck_detalle_precio` CHECK (`precio_unitario` >= 0);