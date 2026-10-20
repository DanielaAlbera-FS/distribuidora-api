// Controller de proveedores: valida lo que llega, limpia los datos y llama al model.
import type { Request, Response, NextFunction } from "express";
import proveedoresModel from "../models/proveedoresModel.js";
import type { DatosProveedor, DatosProveedorActualizar } from "../models/proveedoresModel.js";

// Cuerpo de la petición: llega sin tipo, así que lo tratamos como un objeto cualquiera.
type Cuerpo = Record<string, any>;

// OPCIÓN A: Acepta CUIT con o sin guiones (20-12345678-9 o 20123456789), verificando que sean 11 dígitos.
const esCuitValido = (valor: unknown): boolean => {
  if (typeof valor !== "string") return false;
  return /^\d{11}$/.test(valor.trim().replace(/-/g, ""));
};

const esEmailValido = (valor: unknown): boolean => {
  if (typeof valor !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
};

// ID de la URL: entero positivo. Devuelve NaN si no es válido.
const aId = (valor: unknown): number => {
  if (typeof valor === "string" && /^\d+$/.test(valor)) return Number(valor);
  return NaN;
};
const idValido = (id: number): boolean => Number.isInteger(id) && id > 0 && id <= 2147483647;

// Valida el proveedor completo (POST y PUT).
const validarProveedor = (datos: Cuerpo): string | null => {
  const { nombre, email, CUIL_CUIT } = datos;

  if (!nombre || typeof nombre !== "string" || nombre.trim() === "" || nombre.trim().length > 100) {
    return "El nombre es obligatorio y debe tener entre 1 y 100 caracteres";
  }
  if (!email || !esEmailValido(email) || String(email).trim().length > 100) {
    return "El email es obligatorio y debe tener un formato válido";
  }
  if (!CUIL_CUIT || !esCuitValido(CUIL_CUIT)) {
    return "El CUIT es obligatorio y debe tener 11 números (se admiten guiones)";
  }
  if (datos.telefono && String(datos.telefono).trim().length > 20) {
    return "El teléfono no puede superar los 20 caracteres";
  }
  if (datos.direccion && String(datos.direccion).trim().length > 150) {
    return "La dirección no puede superar los 150 caracteres";
  }
  return null;
};

// OPCIÓN A: Remueve los guiones del CUIT para guardar únicamente los 11 números puros en la BD.
const limpiarProveedor = (datos: Cuerpo): DatosProveedor => {
  const objetoLimpio: DatosProveedor = {
    nombre: String(datos.nombre).trim(),
    email: String(datos.email).trim(),
    CUIL_CUIT: String(datos.CUIL_CUIT).replace(/-/g, "").trim(), // Limpia guiones
  };

  if (datos.telefono !== undefined && datos.telefono !== null && datos.telefono !== "") {
    objetoLimpio.telefono = String(datos.telefono).trim();
  }
  if (datos.direccion !== undefined && datos.direccion !== null && datos.direccion !== "") {
    objetoLimpio.direccion = String(datos.direccion).trim();
  }
  return objetoLimpio;
};

class ProveedoresController {
  // GET /proveedores
  async consultar(req: Request, res: Response, next: NextFunction) {
    try {
      const proveedores = await proveedoresModel.obtenerTodos();
      res.status(200).json({ total: proveedores.length, proveedores });
    } catch (error) {
      next(error);
    }
  }

  // GET /proveedores/:id
  async consultarDetalle(req: Request, res: Response, next: NextFunction) {
    try {
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const proveedor = await proveedoresModel.obtenerPorId(id);
      if (!proveedor) {
        return res.status(404).json({ error: "Proveedor no encontrado" });
      }

      res.status(200).json(proveedor);
    } catch (error) {
      next(error);
    }
  }

  // POST /proveedores
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const datos: Cuerpo = req.body ?? {};
      const errorValidacion = validarProveedor(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const proveedor = await proveedoresModel.crear(limpiarProveedor(datos));
      res.status(201).json({ mensaje: "Proveedor creado con éxito", id: proveedor.id });
    } catch (error) {
      next(error);
    }
  }

  // PUT /proveedores/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const datos: Cuerpo = req.body ?? {};
      const errorValidacion = validarProveedor(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const proveedor = await proveedoresModel.actualizar(id, limpiarProveedor(datos));
      res.status(200).json({ mensaje: "Proveedor actualizado con éxito", proveedor });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /proveedores/:id
  async actualizarParte(req: Request, res: Response, next: NextFunction) {
    try {
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const campos: Cuerpo = req.body ?? {};
      const camposPermitidos = ["nombre", "telefono", "email", "direccion", "CUIL_CUIT"];
      const keys = Object.keys(campos).filter((key) => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: "No se enviaron campos válidos para actualizar" });
      }

      if (campos.nombre !== undefined && (typeof campos.nombre !== "string" || !campos.nombre.trim() || campos.nombre.trim().length > 100)) {
        return res.status(400).json({ error: "El nombre debe ser un texto de 1 a 100 caracteres" });
      }
      if (campos.email !== undefined && !esEmailValido(campos.email)) {
        return res.status(400).json({ error: "El email debe tener un formato válido" });
      }
      if (campos.CUIL_CUIT !== undefined && !esCuitValido(campos.CUIL_CUIT)) {
        return res.status(400).json({ error: "El CUIT debe tener 11 números (se admiten guiones)" });
      }

      const datos: DatosProveedorActualizar = {};
      if (campos.nombre !== undefined) datos.nombre = String(campos.nombre).trim();
      if (campos.email !== undefined) datos.email = String(campos.email).trim();
      if (campos.CUIL_CUIT !== undefined) datos.CUIL_CUIT = String(campos.CUIL_CUIT).replace(/-/g, "").trim(); // Limpia guiones en PATCH
      if (campos.telefono !== undefined) datos.telefono = campos.telefono === null ? null : String(campos.telefono).trim();
      if (campos.direccion !== undefined) datos.direccion = campos.direccion === null ? null : String(campos.direccion).trim();

      const proveedor = await proveedoresModel.actualizarParte(id, datos);
      res.status(200).json({ mensaje: "Proveedor actualizado parcialmente con éxito", proveedor });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /proveedores/:id
  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      await proveedoresModel.eliminar(id);
      res.status(200).json({ mensaje: "Proveedor eliminado con éxito" });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProveedoresController();