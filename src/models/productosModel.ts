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
}

export default new ProductosModel();