// Model de clientes: maneja la persistencia y la baja lógica (activo: false)
import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export type DatosCliente = Prisma.ClienteCreateInput;
export type DatosClienteActualizar = Prisma.ClienteUpdateInput;

class ClientesModel {
  // Obtener solo los clientes activos (o filtrados por nombre)
  async obtenerTodos(nombre?: string) {
    return await prisma.cliente.findMany({
      where: {
        activo: true, // Filtro por baja lógica
        ...(nombre ? { nombre: { contains: nombre } } : {}),
      },
      orderBy: { id: "asc" },
    });
  }

  // Obtener cliente activo por ID
  async obtenerPorId(id: number) {
    return await prisma.cliente.findFirst({
      where: { id, activo: true },
    });
  }

  // Crear cliente
  async crear(datos: DatosCliente) {
    return await prisma.cliente.create({
      data: datos,
    });
  }

  // Actualizar cliente
  async actualizar(id: number, datos: DatosCliente) {
    return await prisma.cliente.update({
      where: { id },
      data: datos,
    });
  }

  // Actualizar parte de un cliente
  async actualizarParte(id: number, datos: DatosClienteActualizar) {
    return await prisma.cliente.update({
      where: { id },
      data: datos,
    });
  }

  // Baja Lógica (Soft Delete): cambia el estado activo a false
  async eliminar(id: number) {
    return await prisma.cliente.update({
      where: { id },
      data: { activo: false },
    });
  }
}

export default new ClientesModel();