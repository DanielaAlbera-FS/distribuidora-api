-- AlterTable
ALTER TABLE `clientes` ADD COLUMN `codigo_postal` VARCHAR(10) NULL,
    ADD COLUMN `fecha_alta` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `localidad` VARCHAR(100) NULL,
    ADD COLUMN `provincia` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `companias_envio` ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `empleados` ADD COLUMN `fecha_alta` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `fecha_nacimiento` DATE NULL,
    ADD COLUMN `localidad` VARCHAR(100) NULL,
    ADD COLUMN `provincia` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `productos` ADD COLUMN `categoria` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `proveedores` ADD COLUMN `codigo_postal` VARCHAR(10) NULL,
    ADD COLUMN `fecha_alta` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `localidad` VARCHAR(100) NULL,
    ADD COLUMN `provincia` VARCHAR(100) NULL;
