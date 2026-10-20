-- AlterTable
ALTER TABLE `clientes` ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `empleados` ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `proveedores` ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true;