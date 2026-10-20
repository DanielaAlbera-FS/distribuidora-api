// Model de productos: único lugar que habla con la base, y lo hace solo a través de Prisma.
import { prisma } from "../config/prisma.js";

// Forma de los datos que el controller le entrega al model (ya validados).
export interface DatosProducto {
  nombre: string;
  id_proveedor: number;
  precio: number;
  stock: number;
}

// include = el JOIN con proveedores: traemos solo el nombre del proveedor.
const conProveedor = { proveedor: { select: { nombre: true } } } as const;

// Prisma devuelve proveedor: { nombre } y precio como Decimal (sin ceros sobrantes).
// Aplanamos el proveedor y fijamos el precio a 2 decimales para que el JSON sea igual al de TP4.
const aplanar = <T extends { precio: { toFixed(decimales: number): string }; proveedor: { nombre: string } }>(fila: T) => {
  const { proveedor, precio, ...resto } = fila;
  return { ...resto, precio: precio.toFixed(2), proveedor: proveedor.nombre };
};

class ProductosModel {
  // Todos los productos, con filtro opcional de stock máximo (stock <= stockMax).
  async obtenerTodos(stockMax?: number) {
    const filas = await prisma.producto.findMany({
      where: stockMax === undefined ? {} : { stock: { lte: stockMax } },
      include: conProveedor,
      orderBy: { id: "asc" },
    });
    return filas.map(aplanar);
  }

  // Un producto por id. Devuelve null si no existe (el controller decide el 404).
  async obtenerPorId(id: number) {
    const fila = await prisma.producto.findUnique({
      where: { id },
      include: conProveedor,
    });
    return fila ? aplanar(fila) : null;
  }

  // Crear: devuelve el producto creado (ya trae el id autogenerado).
  async crear(datos: DatosProducto) {
    return await prisma.producto.create({ data: datos });
  }

  // PUT: reemplaza todos los campos. Si el id no existe, Prisma lanza P2025.
  async actualizar(id: number, datos: DatosProducto) {
    return await prisma.producto.update({ where: { id }, data: datos });
  }

  // PATCH: solo los campos que lleguen. Si el id no existe, Prisma lanza P2025.
  async actualizarParte(id: number, datos: Partial<DatosProducto>) {
    return await prisma.producto.update({ where: { id }, data: datos });
  }

  // Eliminar. Si no existe lanza P2025; si tiene detalles asociados, P2003.
  async eliminar(id: number) {
    return await prisma.producto.delete({ where: { id } });
  }

    // Resumen por proveedor: cantidad de productos, precio promedio y stock total.
  async obtenerResumenPorProveedor() {
    // 1) groupBy agrupa los productos por proveedor y calcula COUNT, AVG y SUM en la base.
    const grupos = await prisma.producto.groupBy({
      by: ["id_proveedor"],
      _count: { id: true },
      _avg: { precio: true },
      _sum: { stock: true },
      orderBy: { id_proveedor: "asc" },
    });

    // 2) groupBy no hace JOIN: traemos aparte los nombres de los proveedores que aparecieron.
    const proveedores = await prisma.proveedor.findMany({
      where: { id: { in: grupos.map((g) => g.id_proveedor) } },
      select: { id: true, nombre: true },
    });
    const nombres = new Map<number, string>(proveedores.map((p) => [p.id, p.nombre] as [number, string]));

    // 3) Unimos las dos cosas y damos el mismo formato de salida que TP4.
    return grupos.map((g) => ({
      id_proveedor: g.id_proveedor,
      proveedor: nombres.get(g.id_proveedor) ?? null,
      cantidad_productos: g._count.id,
      precio_promedio: g._avg.precio ? g._avg.precio.toFixed(2) : null,
      stock_total: g._sum.stock ?? 0,
    }));
  }
}

export default new ProductosModel();