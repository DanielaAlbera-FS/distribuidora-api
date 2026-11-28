-- AlterTable
ALTER TABLE `clientes` ADD COLUMN `condicion_iva` ENUM('responsable_inscripto', 'monotributista', 'exento', 'consumidor_final') NULL;

-- CreateTable
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

-- CreateTable
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

-- AddForeignKey
ALTER TABLE `comprobantes` ADD CONSTRAINT `comprobantes_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Datos iniciales (agregado a mano): la fila unica del emisor, con datos ficticios.
INSERT INTO `emisor` (`id`, `razon_social`, `cuit`, `domicilio`, `ingresos_brutos`, `inicio_actividades`, `punto_venta`)
VALUES (1, 'Distribuidora del Valle S.R.L.', '30-12345678-1', 'Av. Argentina 1234, Neuquen, Neuquen (8300)', '901-123456-7', '2015-03-01', 1);