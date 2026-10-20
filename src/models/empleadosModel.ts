// Model de empleados: gestiona la persistencia y la baja lógica (activo: false)
import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export type DatosEmpleado = Prisma.EmpleadoCreateInput;
export type DatosEmpleadoActualizar = Prisma.EmpleadoUpdateInput;

class EmpleadosModel {
  // Obtener solo los empleados activos (opcionalmente filtrados por apellido)
  async obtenerTodos(apellido?: string) {
    return await prisma.empleado.findMany({
      where: {
        activo: true,
        ...(apellido ? { apellido: { contains: apellido } } : {}),
      },
      orderBy: { id: "asc" },
    });
  }

  // Obtener un empleado activo por su ID
  async obtenerPorId(id: number) {
    return await prisma.empleado.findFirst({
      where: { id, activo: true },
    });
  }

  // Crear un nuevo empleado
  async crear(datos: DatosEmpleado) {
    return await prisma.empleado.create({
      data: datos,
    });
  }

  // Actualización completa (PUT)
  async actualizar(id: number, datos: DatosEmpleado) {
    return await prisma.empleado.update({
      where: { id },
      data: datos,
    });
  }

  // Actualización parcial (PATCH)
  async actualizarParte(id: number, datos: DatosEmpleadoActualizar) {
    return await prisma.empleado.update({
      where: { id },
      data: datos,
    });
  }

  // Baja Lógica (Soft Delete): cambia activo a false
  async eliminar(id: number) {
    return await prisma.empleado.update({
      where: { id },
      data: { activo: false },
    });
  }
}

export default new EmpleadosModel();