// Model de compañías de envío: ejecuta las consultas a la base de datos mediante Prisma Client y maneja la baja lógica (activo: false).
import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export type DatosCompaniaEnvio = Prisma.CompaniaEnvioCreateInput;
export type DatosCompaniaEnvioActualizar = Prisma.CompaniaEnvioUpdateInput;

class CompaniasEnvioModel {
  // Obtener solo las compañías activas (opcionalmente filtradas por nombre)
  async obtenerTodas(nombre?: string) {
    return await prisma.companiaEnvio.findMany({
      where: {
        activo: true, // Filtro por baja lógica
        ...(nombre ? { nombre: { contains: nombre } } : {}),
      },
      orderBy: { id: "asc" },
    });
  }

  // Obtener una compañía activa por ID (null si no existe o está dada de baja)
  async obtenerPorId(id: number) {
    return await prisma.companiaEnvio.findFirst({
      where: { id, activo: true },
    });
  }

  // Crear una nueva compañía de envío
  async crear(datos: DatosCompaniaEnvio) {
    return await prisma.companiaEnvio.create({
      data: datos,
    });
  }

  // Actualización completa (PUT)
  async actualizar(id: number, datos: DatosCompaniaEnvio) {
    return await prisma.companiaEnvio.update({
      where: { id },
      data: datos,
    });
  }

  // Actualización parcial (PATCH)
  async actualizarParte(id: number, datos: DatosCompaniaEnvioActualizar) {
    return await prisma.companiaEnvio.update({
      where: { id },
      data: datos,
    });
  }

  // Baja lógica (soft delete): cambia el estado activo a false y conserva la fila y sus pedidos
  async eliminar(id: number) {
    return await prisma.companiaEnvio.update({
      where: { id },
      data: { activo: false },
    });
  }
}

export default new CompaniasEnvioModel();