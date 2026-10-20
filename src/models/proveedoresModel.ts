import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export type DatosProveedor = Prisma.ProveedorCreateInput;
export type DatosProveedorActualizar = Prisma.ProveedorUpdateInput;

class ProveedoresModel {
  async obtenerTodos() {
    return await prisma.proveedor.findMany({
      where: { activo: true }, // Solo proveedores activos
      orderBy: { id: "asc" },
    });
  }

  async obtenerPorId(id: number) {
    return await prisma.proveedor.findFirst({
      where: { id, activo: true },
    });
  }

  async crear(datos: DatosProveedor) {
    return await prisma.proveedor.create({ data: datos });
  }

  async actualizar(id: number, datos: DatosProveedor) {
    return await prisma.proveedor.update({ where: { id }, data: datos });
  }

  async actualizarParte(id: number, datos: DatosProveedorActualizar) {
    return await prisma.proveedor.update({ where: { id }, data: datos });
  }

  // Baja Lógica: cambia el campo activo a false
  async eliminar(id: number) {
    return await prisma.proveedor.update({
      where: { id },
      data: { activo: false },
    });
  }
}

export default new ProveedoresModel();