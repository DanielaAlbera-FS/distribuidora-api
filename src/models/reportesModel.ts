// Model de reportes: informes que se resuelven con SQL crudo a través de Prisma (consigna 3.4).
import { prisma } from "../config/prisma.js"; // la instancia única del cliente (src/config/prisma.ts)

class ReportesModel {
  // Cuántos pedidos hizo cada cliente y cuánto compró en total.
  async comprasPorCliente() {
    // Describimos a mano la forma de las filas porque con SQL crudo Prisma no puede deducirla.
    // COUNT llega como bigint y SUM llega como texto o Decimal, por eso los tipos de abajo.
    const filas = await prisma.$queryRaw<
      { id_cliente: number; cliente: string; cantidad_pedidos: bigint; total_comprado: string }[]
    >`
      SELECT c.id AS id_cliente,
             c.nombre AS cliente,
             COUNT(DISTINCT p.id) AS cantidad_pedidos,
             SUM(d.cantidad * d.precio_unitario) AS total_comprado
      FROM clientes c
      INNER JOIN pedidos p ON p.id_cliente = c.id
      INNER JOIN detalle_pedido d ON d.id_pedido = p.id
      GROUP BY c.id, c.nombre
      ORDER BY total_comprado DESC
    `;

    // Convertimos a tipos que JSON sabe enviar (JSON.stringify falla con bigint) y damos formato de dinero.
    return filas.map((fila) => ({
      id_cliente: fila.id_cliente,
      cliente: fila.cliente,
      cantidad_pedidos: Number(fila.cantidad_pedidos),
      total_comprado: Number(fila.total_comprado).toFixed(2),
    }));
  }
}

export default new ReportesModel();