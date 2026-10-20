// Model de compañías de envío: ejecuta las consultas a la base de datos mediante Prisma Client[cite: 5].
import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export type DatosCompaniaEnvio = Prisma.CompaniaEnvioCreateInput;
export type DatosCompaniaEnvioActualizar = Prisma.CompaniaEnvioUpdateInput;

class CompaniasEnvioModel {
  // Obtener todas las compañías (opcionalmente filtradas por nombre)
  async obtenerTodas(nombre?: string) {
    return await prisma.companiaEnvio.findMany({
      where: nombre
        ? {
            nombre: {
              contains: nombre,
            },
          }
        : {},
      orderBy: { id: "asc" },
    });
  }

  // Obtener una compañía por ID[cite: 1]
  async obtenerPorId(id: number) {
    return await prisma.companiaEnvio.findUnique({
      where: { id },
    });
  }

  // Crear una nueva compañía de envío[cite: 1]
  async crear(datos: DatosCompaniaEnvio) {
    return await prisma.companiaEnvio.create({
      data: datos,
    });
  }

  // Actualización completa (PUT)[cite: 1]
  async actualizar(id: number, datos: DatosCompaniaEnvio) {
    return await prisma.companiaEnvio.update({
      where: { id },
      data: datos,
    });
  }

  // Actualización parcial (PATCH)[cite: 1]
  async actualizarParte(id: number, datos: DatosCompaniaEnvioActualizar) {
    return await prisma.companiaEnvio.update({
      where: { id },
      data: datos,
    });
  }

  // Eliminar una compañía por ID[cite: 1]
  async eliminar(id: number) {
    return await prisma.companiaEnvio.delete({
      where: { id },
    });
  }
}

export default new CompaniasEnvioModel();