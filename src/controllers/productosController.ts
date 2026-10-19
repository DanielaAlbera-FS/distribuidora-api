// Controller de productos: valida lo que llega, llama al model y arma la respuesta HTTP.
import type { Request, Response, NextFunction } from "express";
import productosModel from "../models/productosModel.js";
import type { DatosProducto } from "../models/productosModel.js";

const MAX_INT = 2147483647; // Tope de un INT de MySQL.
const MAX_PRECIO = 99999999.99; // Tope de DECIMAL(10,2).

// Cuerpo de la petición: llega sin tipo, así que lo tratamos como un objeto cualquiera.
type Cuerpo = Record<string, any>;

// Convierte a número solo si es number o un string numérico; si no, NaN.
const aNumero = (valor: unknown): number => {
  if (typeof valor === "number") return valor;
  if (typeof valor === "string" && /^\d+(\.\d+)?$/.test(valor.trim())) return Number(valor);
  return NaN;
};

// Entero dentro del rango [minimo, MAX_INT].
const esEntero = (valor: unknown, minimo: number): boolean => {
  const numero = aNumero(valor);
  return Number.isInteger(numero) && numero >= minimo && numero <= MAX_INT;
};

// Precio positivo (mayor a 0) y dentro del tope.
const esPrecioValido = (valor: unknown): boolean => {
  const numero = aNumero(valor);
  return Number.isFinite(numero) && numero > 0 && numero <= MAX_PRECIO;
};

// Valida el producto completo (POST y PUT). Devuelve el mensaje de error o null si está todo bien.
const validarProducto = (datos: Cuerpo): string | null => {
  const { nombre, precio, stock, id_proveedor } = datos;

  if (nombre === undefined || precio === undefined || stock === undefined || id_proveedor === undefined) {
    return "Faltan campos obligatorios: nombre, precio, stock e id_proveedor";
  }
  if (typeof nombre !== "string" || nombre.trim() === "" || nombre.trim().length > 100) {
    return "El nombre debe ser un texto de 1 a 100 caracteres";
  }
  if (!esPrecioValido(precio)) {
    return "El precio debe ser un número positivo mayor a 0";
  }
  if (!esEntero(stock, 0)) {
    return "El stock debe ser un número entero mayor o igual a 0";
  }
  if (!esEntero(id_proveedor, 1)) {
    return "El id_proveedor debe ser un número entero positivo";
  }
  return null;
};

// Arma el objeto limpio (texto sin espacios sobrantes, números ya convertidos) para el model.
const limpiarProducto = (datos: Cuerpo): DatosProducto => ({
  nombre: datos.nombre.trim(),
  precio: Number(datos.precio),
  stock: Number(datos.stock),
  id_proveedor: Number(datos.id_proveedor),
});

class ProductosController {
  // GET /productos?stock_max=N
  async consultar(req: Request, res: Response, next: NextFunction) {
    try {
      const { stock_max } = req.query;

      if (stock_max !== undefined && !esEntero(stock_max, 0)) {
        return res.status(400).json({ error: "El parámetro stock_max debe ser un número entero mayor o igual a 0" });
      }

      const stockMax = stock_max === undefined ? undefined : Number(stock_max);
      const filas = await productosModel.obtenerTodos(stockMax); // Ya no hay [filas]: Prisma devuelve el array.

      res.status(200).json({ total: filas.length, productos: filas });
    } catch (error) {
      next(error); // El middleware global decide el código y el mensaje.
    }
  }

  // GET /productos/:id
  async consultarDetalle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const producto = await productosModel.obtenerPorId(Number(id));
      if (producto === null) { // findUnique devuelve null si no existe.
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      res.status(200).json(producto);
    } catch (error) {
      next(error);
    }
  }

  // POST /productos
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const datos: Cuerpo = req.body ?? {};
      const errorValidacion = validarProducto(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const producto = await productosModel.crear(limpiarProducto(datos)); // create devuelve el producto con su id.

      res.status(201).json({ mensaje: "Producto creado con éxito", id: producto.id });
    } catch (error) {
      next(error); // Si el proveedor no existe, Prisma lanza P2003 y lo traduce el middleware.
    }
  }

  // PUT /productos/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const datos: Cuerpo = req.body ?? {};
      const errorValidacion = validarProducto(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      await productosModel.actualizar(Number(id), limpiarProducto(datos)); // Si el id no existe: P2025 -> 404.
      const producto = await productosModel.obtenerPorId(Number(id)); // Lo volvemos a leer para devolverlo con el nombre del proveedor.

      res.status(200).json({ mensaje: "Producto actualizado con éxito", producto });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /productos/:id
  async actualizarParte(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const campos: Cuerpo = req.body ?? {};
      const camposPermitidos = ["nombre", "precio", "stock", "id_proveedor"];
      const keys = Object.keys(campos).filter((key) => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: "No se enviaron campos válidos para actualizar" });
      }

      if (campos.nombre !== undefined && (typeof campos.nombre !== "string" || !campos.nombre.trim())) {
        return res.status(400).json({ error: "El nombre debe ser un texto válido" });
      }
      if (campos.precio !== undefined && !esPrecioValido(campos.precio)) {
        return res.status(400).json({ error: "El precio debe ser un número positivo" });
      }
      if (campos.stock !== undefined && !esEntero(campos.stock, 0)) {
        return res.status(400).json({ error: "El stock debe ser un número entero mayor o igual a 0" });
      }
      if (campos.id_proveedor !== undefined && !esEntero(campos.id_proveedor, 1)) {
        return res.status(400).json({ error: "El id_proveedor debe ser un número entero positivo" });
      }

      // En vez de armar un SET con texto (como en TP4), armamos un objeto solo con los campos que llegaron.
      const datos: Partial<DatosProducto> = {};
      if (campos.nombre !== undefined) datos.nombre = campos.nombre.trim();
      if (campos.precio !== undefined) datos.precio = Number(campos.precio);
      if (campos.stock !== undefined) datos.stock = Number(campos.stock);
      if (campos.id_proveedor !== undefined) datos.id_proveedor = Number(campos.id_proveedor);

      await productosModel.actualizarParte(Number(id), datos); // Si el id no existe: P2025 -> 404.
      const producto = await productosModel.obtenerPorId(Number(id));

      res.status(200).json({ mensaje: "Producto actualizado parcialmente con éxito", producto });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /productos/:id
  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      await productosModel.eliminar(Number(id)); // P2025 si no existe (404), P2003 si tiene detalles asociados (400).

      res.status(200).json({ mensaje: "Producto eliminado con éxito" });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductosController();