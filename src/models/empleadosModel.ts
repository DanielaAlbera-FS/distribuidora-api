// Model de empleados: gestiona la persistencia y la baja lógica (activo: false)
import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

// Datos que el controller le pasa al model. Son los de Prisma, con dos cambios:
// - fecha_alta se quita a propósito: nunca llega desde la API, la pone la base al crear.
// - fecha_nacimiento llega como texto AAAA-MM-DD (o null en el PATCH para borrarla); acá se convierte a fecha.
type CamposQueNoLlegan = "fecha_alta" | "fecha_nacimiento" | "activo" | "pedidos";
export type DatosEmpleado = Omit<Prisma.EmpleadoCreateInput, CamposQueNoLlegan> & {
  fecha_nacimiento?: string;
};
export type DatosEmpleadoActualizar = Omit<Prisma.EmpleadoUpdateInput, CamposQueNoLlegan> & {
  fecha_nacimiento?: string | null;
};

// Convierte "1992-04-18" en una fecha a las 00:00 UTC (la "Z" evita que la zona horaria la corra de día).
const aFecha = (texto: string) => new Date(`${texto}T00:00:00Z`);

// Camino inverso: de la fecha de Prisma a "1992-04-18", igual que hacemos con la fecha de los pedidos.
const deFecha = (fecha: Date) => fecha.toISOString().slice(0, 10);

// Prepara los datos para Prisma: solo toca fecha_nacimiento si vino.
const paraPrisma = <T extends { fecha_nacimiento?: string | null }>(datos: T) => {
  const { fecha_nacimiento, ...resto } = datos;
  if (fecha_nacimiento === undefined) return resto;
  return { ...resto, fecha_nacimiento: fecha_nacimiento === null ? null : aFecha(fecha_nacimiento) };
};

// Devuelve el empleado con fecha_nacimiento como texto AAAA-MM-DD (o null si no la tiene).
const formatear = <T extends { fecha_nacimiento: Date | null }>(empleado: T) => ({
  ...empleado,
  fecha_nacimiento: empleado.fecha_nacimiento ? deFecha(empleado.fecha_nacimiento) : null,
});

class EmpleadosModel {
  // Obtener solo los empleados activos (opcionalmente filtrados por apellido)
  async obtenerTodos(apellido?: string) {
    const empleados = await prisma.empleado.findMany({
      where: {
        activo: true,
        ...(apellido ? { apellido: { contains: apellido } } : {}),
      },
      orderBy: { id: "asc" },
    });
    return empleados.map(formatear);
  }

  // Obtener un empleado activo por su ID
  async obtenerPorId(id: number) {
    const empleado = await prisma.empleado.findFirst({
      where: { id, activo: true },
    });
    return empleado ? formatear(empleado) : null;
  }

  // Crear un nuevo empleado
  async crear(datos: DatosEmpleado) {
    const empleado = await prisma.empleado.create({
      data: paraPrisma(datos),
    });
    return formatear(empleado);
  }

  // Actualización completa (PUT)
  async actualizar(id: number, datos: DatosEmpleado) {
    const empleado = await prisma.empleado.update({
      where: { id },
      data: paraPrisma(datos),
    });
    return formatear(empleado);
  }

  // Actualización parcial (PATCH)
  async actualizarParte(id: number, datos: DatosEmpleadoActualizar) {
    const empleado = await prisma.empleado.update({
      where: { id },
      data: paraPrisma(datos),
    });
    return formatear(empleado);
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
