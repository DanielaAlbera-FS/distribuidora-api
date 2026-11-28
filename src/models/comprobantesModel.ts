// Model de comprobantes: verifica, emite y arma la factura tipo A de un pedido. Habla con la base solo a través de Prisma.
import { prisma } from "../config/prisma.js"; // la instancia única del cliente (src/config/prisma.ts)
import { Prisma } from "../generated/prisma/client.js"; // la usamos para el tipo Decimal

// Cómo se escribe cada condición frente al IVA en la factura.
const TEXTO_CONDICION_IVA = {
  responsable_inscripto: "Responsable Inscripto",
  monotributista: "Monotributista",
  exento: "IVA Exento",
  consumidor_final: "Consumidor Final",
} as const;

// La distribuidora es responsable inscripta, así que la factura A solo va a responsables inscriptos o monotributistas.
const CONDICIONES_FACTURA_A: string[] = ["responsable_inscripto", "monotributista"];

// Motivo por el que no se puede emitir: el código HTTP que corresponde y el mensaje.
export interface ImpedimentoEmision {
  estado: 400 | 404 | 500;
  error: string;
}

// Completa con ceros a la izquierda: rellenar(1, 4) -> "0001".
const rellenar = (numero: number, largo: number) => String(numero).padStart(largo, "0");

// Fecha AAAA-MM-DD en hora argentina (así una factura emitida a la noche no queda con la fecha del día siguiente).
const fechaArgentina = (fecha: Date) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }).format(fecha);

// Las columnas DATE de la base (sin hora) se muestran tal cual: AAAA-MM-DD.
const soloFecha = (fecha: Date) => fecha.toISOString().slice(0, 10);

class ComprobantesModel {
  // Revisa todo lo necesario antes de emitir. Devuelve el impedimento, o null si se puede emitir.
  async verificarEmision(idPedido: number): Promise<ImpedimentoEmision | null> {
    const pedido = await prisma.pedido.findUnique({
      where: { id: idPedido },
      include: {
        cliente: true,
        comprobante: { select: { id: true } },
        detalles: { select: { cantidad: true } },
      },
    });
    if (pedido === null) return { estado: 404, error: "Pedido no encontrado" };
    if (pedido.comprobante !== null) return { estado: 400, error: "El pedido ya tiene un comprobante emitido" };

    const cliente = pedido.cliente;
    if (!cliente.activo) return { estado: 400, error: "El cliente del pedido fue dado de baja" };
    if (cliente.condicion_iva === null) {
      return { estado: 400, error: "El cliente no tiene cargada su condición frente al IVA" };
    }
    if (!CONDICIONES_FACTURA_A.includes(cliente.condicion_iva)) {
      return { estado: 400, error: "La factura A solo se emite a clientes responsables inscriptos o monotributistas" };
    }
    if (cliente.direccion === null || cliente.direccion.trim() === "") {
      return { estado: 400, error: "El cliente no tiene domicilio (dirección) cargado" };
    }
    if (pedido.detalles.length === 0) return { estado: 400, error: "El pedido no tiene líneas de detalle" };

    const emisor = await prisma.emisor.findUnique({ where: { id: 1 } });
    if (emisor === null) return { estado: 500, error: "No hay datos del emisor cargados en la base" };

    return null;
  }

  // Crea el comprobante con el número siguiente. Todo ocurre en una transacción que bloquea la fila del emisor,
  // así dos facturas emitidas al mismo tiempo nunca reciben el mismo número.
  async emitir(idPedido: number) {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM emisor WHERE id = 1 FOR UPDATE`; // bloquea hasta terminar la transacción
      const emisor = await tx.emisor.findUnique({ where: { id: 1 } });
      if (emisor === null) throw new Error("No hay datos del emisor cargados en la base");

      const ultimo = await tx.comprobante.aggregate({
        _max: { numero: true },
        where: { tipo: "A", punto_venta: emisor.punto_venta },
      });
      const numero = (ultimo._max.numero ?? 0) + 1; // el primero es el 1

      return await tx.comprobante.create({
        data: { id_pedido: idPedido, tipo: "A", punto_venta: emisor.punto_venta, numero },
      });
    });
  }

  // Arma la factura completa de un pedido. Devuelve null si el pedido no tiene comprobante emitido.
  async obtenerFactura(idPedido: number) {
    const comprobante = await prisma.comprobante.findUnique({
      where: { id_pedido: idPedido },
      include: {
        pedido: {
          include: {
            cliente: true,
            detalles: {
              include: { producto: { select: { nombre: true } } }, // el JOIN con productos para la descripción
              orderBy: { id_producto: "asc" },
            },
          },
        },
      },
    });
    if (comprobante === null) return null;

    const emisor = await prisma.emisor.findUnique({ where: { id: 1 } });
    if (emisor === null) throw new Error("No hay datos del emisor cargados en la base");

    const { pedido } = comprobante;
    const { cliente } = pedido;

    // Cada línea con su subtotal, y el total del pedido (con Decimal: exacto, sin errores de redondeo).
    let total = new Prisma.Decimal(0);
    const lineas = pedido.detalles.map((linea) => {
      const subtotal = linea.precio_unitario.mul(linea.cantidad);
      total = total.plus(subtotal);
      return {
        producto: linea.producto.nombre,
        cantidad: linea.cantidad,
        precio_unitario: linea.precio_unitario.toFixed(2),
        subtotal: subtotal.toFixed(2),
      };
    });

    // Domicilio del cliente en una sola línea: "Calle 10, Neuquen, Neuquen (8300)".
    const zona = [cliente.direccion, cliente.localidad, cliente.provincia].filter(Boolean).join(", ");
    const domicilioCliente = cliente.codigo_postal ? `${zona} (${cliente.codigo_postal})` : zona;

    return {
      comprobante: {
        tipo: comprobante.tipo,
        punto_venta: rellenar(comprobante.punto_venta, 4),
        numero: rellenar(comprobante.numero, 8),
        numero_completo: `${rellenar(comprobante.punto_venta, 4)}-${rellenar(comprobante.numero, 8)}`,
        fecha_emision: fechaArgentina(comprobante.fecha_emision),
      },
      emisor: {
        razon_social: emisor.razon_social,
        cuit: emisor.cuit,
        domicilio: emisor.domicilio,
        condicion_iva: TEXTO_CONDICION_IVA.responsable_inscripto, // solo un responsable inscripto emite factura A
        ingresos_brutos: emisor.ingresos_brutos,
        inicio_actividades: soloFecha(emisor.inicio_actividades),
      },
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        cuit: cliente.CUIL_CUIT,
        domicilio: domicilioCliente,
        condicion_iva: cliente.condicion_iva === null ? null : TEXTO_CONDICION_IVA[cliente.condicion_iva],
      },
      pedido: { id: pedido.id, fecha: soloFecha(pedido.fecha) },
      lineas,
      total: total.toFixed(2),
    };
  }
}

export default new ComprobantesModel();