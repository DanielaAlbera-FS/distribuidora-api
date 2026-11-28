import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

// Datos que el controller le pasa al model: incluyen localidad, provincia y codigo_postal (opcionales).
// fecha_alta se quita del tipo a propósito: nunca llega desde la API, la pone la base al crear.
export type DatosProveedor = Omit<Prisma.ProveedorCreateInput, "fecha_alta" | "activo" | "productos">;
export type DatosProveedorActualizar = Omit<Prisma.ProveedorUpdateInput, "fecha_alta" | "activo" | "productos">;

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