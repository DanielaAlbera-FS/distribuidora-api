// Controller de productos: revisa el resultado de la validación, llama al model y arma la respuesta HTTP.
import type { Request, Response, NextFunction } from "express";
import { validationResult, matchedData } from "express-validator";
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

// Revisa lo que dejó el checkSchema de la ruta (patrón de la clase: validationResult).
// Devuelve el cuerpo de la respuesta 400 si hubo errores, o null si todo está bien.
const errorDeValidacion = (req: Request) => {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return null;
  const errores = resultado.array();
  return { error: String(errores[0]?.msg), errores }; // "error" con el primer mensaje, como el resto de la API
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
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }

      const { stock_max } = req.query;

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
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idProductoValidationSchema

      const producto = await productosModel.obtenerPorId(id);
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
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }

      // matchedData devuelve solo los campos del esquema (el nombre ya viene recortado por trim).
      const datos: Cuerpo = matchedData(req, { locations: ["body"] });
      const producto = await productosModel.crear(limpiarProducto(datos)); // create devuelve el producto con su id.

      res.status(201).json({ mensaje: "Producto creado con éxito", id: producto.id });
    } catch (error) {
      next(error); // Si el proveedor no existe, Prisma lanza P2003 y lo traduce el middleware.
    }
  }

  // PUT /productos/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idProductoValidationSchema

      // matchedData devuelve solo los campos del esquema (el nombre ya viene recortado por trim).
      const datos: Cuerpo = matchedData(req, { locations: ["body"] });
      await productosModel.actualizar(id, limpiarProducto(datos)); // Si el id no existe: P2025 -> 404.
      const producto = await productosModel.obtenerPorId(id); // Lo volvemos a leer para devolverlo con el nombre del proveedor.

      res.status(200).json({ mensaje: "Producto actualizado con éxito", producto });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /productos/:id
  async actualizarParte(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idProductoValidationSchema

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

      await productosModel.actualizarParte(id, datos); // Si el id no existe: P2025 -> 404.
      const producto = await productosModel.obtenerPorId(id);

      res.status(200).json({ mensaje: "Producto actualizado parcialmente con éxito", producto });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /productos/:id
  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idProductoValidationSchema

      await productosModel.eliminar(id); // P2025 si no existe (404), P2003 si tiene detalles asociados (400).

      res.status(200).json({ mensaje: "Producto eliminado con éxito" });
    } catch (error) {
      next(error);
    }
  }

  // GET /productos/resumen
  async resumen(req: Request, res: Response, next: NextFunction) {
    try {
      const filas = await productosModel.obtenerResumenPorProveedor();
      res.status(200).json({ total_proveedores: filas.length, resumen: filas });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductosController();