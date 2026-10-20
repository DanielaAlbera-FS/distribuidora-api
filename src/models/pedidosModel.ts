// Model de pedidos y de su detalle: único lugar que habla con la base, y lo hace solo a través de Prisma.
import { prisma } from "../config/prisma.js"; // la instancia única del cliente (src/config/prisma.ts)
import { Prisma } from "../generated/prisma/client.js"; // la usamos para el tipo Decimal y para tipar el JOIN

// Los tres estados permitidos. Es la misma lista que el enum EstadoPedido del schema.
export type EstadoPedido = "pendiente" | "enviado" | "entregado";

// Forma de los datos de un pedido que el controller le entrega al model (ya validados).
export interface DatosPedido {
  fecha: string; // llega como texto AAAA-MM-DD; el model la convierte a fecha
  estado: EstadoPedido; // uno de los tres estados
  id_cliente: number; // FK a clientes
  id_empleado: number; // FK a empleados
  id_compania_envio: number; // FK a companias_envio
}

// Convierte "2026-10-01" en una fecha a las 00:00 UTC (la "Z" evita que la zona horaria la corra de día).
const aFecha = (texto: string) => new Date(`${texto}T00:00:00Z`);

// Hace el camino inverso: de fecha de Prisma a "2026-10-01" (como devolvía DATE_FORMAT en TP4).
const deFecha = (fecha: Date) => fecha.toISOString().slice(0, 10);

// include = el JOIN con tres tablas: pedimos solo las columnas que necesitamos de cada una.
const conRelaciones = {
  cliente: { select: { nombre: true } }, // nombre del cliente
  empleado: { select: { nombre: true, apellido: true } }, // nombre y apellido del empleado
  compania_envio: { select: { nombre: true } }, // nombre de la compañía de envío
} as const;

// Tipo de un pedido tal como lo devuelve Prisma con ese include.
type PedidoConRelaciones = Prisma.PedidoGetPayload<{ include: typeof conRelaciones }>;

// Aplana el resultado para que el JSON sea igual al de TP4: fecha como texto y nombres en lugar de objetos.
const aplanar = (fila: PedidoConRelaciones) => ({
  id: fila.id,
  fecha: deFecha(fila.fecha),
  estado: fila.estado,
  id_cliente: fila.id_cliente,
  cliente: fila.cliente.nombre,
  id_empleado: fila.id_empleado,
  empleado: `${fila.empleado.nombre} ${fila.empleado.apellido}`, // equivale al CONCAT de TP4
  id_compania_envio: fila.id_compania_envio,
  compania_envio: fila.compania_envio.nombre,
});

class PedidosModel {
  // ---------------------------------------------------------------- Pedidos

  // Todos los pedidos, con filtros opcionales de estado y fecha.
  async obtenerTodos(estado?: EstadoPedido, fecha?: string) {
    const where: Prisma.PedidoWhereInput = {}; // arranca sin condiciones
    if (estado !== undefined) where.estado = estado; // agrega la condición de estado solo si vino
    if (fecha !== undefined) where.fecha = aFecha(fecha); // agrega la condición de fecha solo si vino
    const filas = await prisma.pedido.findMany({ where, include: conRelaciones, orderBy: { id: "asc" } });
    return filas.map(aplanar);
  }

  // Un pedido por id. Devuelve null si no existe (el controller decide el 404).
  async obtenerPorId(id: number) {
    const fila = await prisma.pedido.findUnique({ where: { id }, include: conRelaciones });
    return fila ? aplanar(fila) : null;
  }

  // Indica si un pedido existe, sin traer el JOIN completo.
  async existe(id: number) {
    const fila = await prisma.pedido.findUnique({ where: { id }, select: { id: true } });
    return fila !== null;
  }

   // Verifica que el cliente y el empleado existan y no estén dados de baja.
  // Devuelve un mensaje de error, o null si está todo bien.
  async verificarActivos(idCliente?: number, idEmpleado?: number) {
    if (idCliente !== undefined) {
      const cliente = await prisma.cliente.findFirst({
        where: { id: idCliente, activo: true },
        select: { id: true },
      });
      if (cliente === null) return "El cliente no existe o fue dado de baja";
    }
    if (idEmpleado !== undefined) {
      const empleado = await prisma.empleado.findFirst({
        where: { id: idEmpleado, activo: true },
        select: { id: true },
      });
      if (empleado === null) return "El empleado no existe o fue dado de baja";
    }
    return null;
  }

  
  // Inserta un pedido nuevo y devuelve la fila creada (el controller usa su id).
  async crear(datos: DatosPedido) {
    return await prisma.pedido.create({
      data: {
        fecha: aFecha(datos.fecha),
        estado: datos.estado,
        id_cliente: datos.id_cliente,
        id_empleado: datos.id_empleado,
        id_compania_envio: datos.id_compania_envio,
      },
    });
  }

  // Reemplaza todos los campos de un pedido (PUT). Si el id no existe, Prisma lanza P2025.
  async actualizar(id: number, datos: DatosPedido) {
    return await prisma.pedido.update({
      where: { id },
      data: {
        fecha: aFecha(datos.fecha),
        estado: datos.estado,
        id_cliente: datos.id_cliente,
        id_empleado: datos.id_empleado,
        id_compania_envio: datos.id_compania_envio,
      },
    });
  }

  // Actualización parcial (PATCH): solo viajan los campos que el controller permitió.
  async actualizarParte(id: number, datos: Partial<DatosPedido>) {
    const { fecha, ...resto } = datos; // separamos la fecha porque hay que convertirla
    return await prisma.pedido.update({
      where: { id },
      data: {
        ...resto, // los campos que no necesitan conversión
        ...(fecha !== undefined && { fecha: aFecha(fecha) }), // la fecha, solo si vino
      },
    });
  }

  // Elimina un pedido. Sus líneas de detalle se borran solas (onDelete: Cascade en el schema).
  async eliminar(id: number) {
    return await prisma.pedido.delete({ where: { id } });
  }

  // ------------------------------------------------------- Total del pedido

  // Suma cantidad * precio_unitario de todas las líneas. Prisma no multiplica dos columnas en una
  // agregación, así que traemos las líneas y sumamos con Decimal (exacto, sin errores de redondeo).
  async obtenerTotal(idPedido: number) {
    const lineas = await prisma.detallePedido.findMany({
      where: { id_pedido: idPedido },
      select: { cantidad: true, precio_unitario: true },
    });
    const total = lineas.reduce(
      (acumulado, linea) => acumulado.plus(linea.precio_unitario.mul(linea.cantidad)),
      new Prisma.Decimal(0), // un pedido sin líneas suma 0, como el COALESCE de TP4
    );
    return total.toFixed(2); // texto con dos decimales, igual que en TP4
  }

  // ------------------------------------------------------ Detalle del pedido

  // Líneas de un pedido, con el nombre del producto.
  async obtenerLineas(idPedido: number) {
    const filas = await prisma.detallePedido.findMany({
      where: { id_pedido: idPedido },
      include: { producto: { select: { nombre: true } } }, // el JOIN con productos
      orderBy: { id_producto: "asc" },
    });
    return filas.map((fila) => ({
      id_pedido: fila.id_pedido,
      id_producto: fila.id_producto,
      producto: fila.producto.nombre,
      cantidad: fila.cantidad,
      precio_unitario: fila.precio_unitario.toFixed(2),
    }));
  }

  // Agrega una línea al pedido. Si el producto ya está en el pedido, Prisma lanza P2002.
  async crearLinea(idPedido: number, idProducto: number, cantidad: number, precioUnitario: number) {
    return await prisma.detallePedido.create({
      data: { id_pedido: idPedido, id_producto: idProducto, cantidad, precio_unitario: precioUnitario },
    });
  }

  // Modifica cantidad y precio de una línea. La línea se identifica con la clave compuesta.
  async actualizarLinea(idPedido: number, idProducto: number, cantidad: number, precioUnitario: number) {
    return await prisma.detallePedido.update({
      where: { id_pedido_id_producto: { id_pedido: idPedido, id_producto: idProducto } },
      data: { cantidad, precio_unitario: precioUnitario },
    });
  }

  // Elimina una línea del pedido. Si la línea no existe, Prisma lanza P2025.
  async eliminarLinea(idPedido: number, idProducto: number) {
    return await prisma.detallePedido.delete({
      where: { id_pedido_id_producto: { id_pedido: idPedido, id_producto: idProducto } },
    });
  }
}

export default new PedidosModel();