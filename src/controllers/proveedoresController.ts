// Controller de proveedores: revisa el resultado de la validación, llama al model y arma la respuesta HTTP.
import type { Request, Response, NextFunction } from "express";
import { validationResult, matchedData } from "express-validator";
import proveedoresModel from "../models/proveedoresModel.js";
import type { DatosProveedor, DatosProveedorActualizar } from "../models/proveedoresModel.js";

// Cuerpo de la petición: llega sin tipo, así que lo tratamos como un objeto cualquiera.
type Cuerpo = Record<string, any>;

// Acepta CUIT con o sin guiones (20-12345678-9 o 20123456789), verificando que sean 11 dígitos.
// Se sigue usando en el PATCH, cuyos campos del cuerpo se controlan acá.
const esCuitValido = (valor: unknown): boolean => {
  if (typeof valor !== "string") return false;
  return /^\d{11}$/.test(valor.trim().replace(/-/g, ""));
};

const esEmailValido = (valor: unknown): boolean => {
  if (typeof valor !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
};

// Revisa lo que dejó el checkSchema de la ruta (patrón de la clase: validationResult).
// Devuelve el cuerpo de la respuesta 400 si hubo errores, o null si todo está bien.
const errorDeValidacion = (req: Request) => {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return null;
  const errores = resultado.array();
  return { error: String(errores[0]?.msg), errores }; // "error" con el primer mensaje, como el resto de la API
};

// Remueve los guiones del CUIT para guardar únicamente los 11 números puros en la BD.
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
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

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
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }

      // matchedData devuelve solo los campos del esquema, ya recortados por trim.
      const datos: Cuerpo = matchedData(req, { locations: ["body"] });
      const proveedor = await proveedoresModel.crear(limpiarProveedor(datos));

      res.status(201).json({ mensaje: "Proveedor creado con éxito", id: proveedor.id });
    } catch (error) {
      next(error);
    }
  }

  // PUT /proveedores/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      // matchedData devuelve solo los campos del esquema, ya recortados por trim.
      const datos: Cuerpo = matchedData(req, { locations: ["body"] });
      const proveedor = await proveedoresModel.actualizar(id, limpiarProveedor(datos));

      res.status(200).json({ mensaje: "Proveedor actualizado con éxito", proveedor });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /proveedores/:id
  async actualizarParte(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

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
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      await proveedoresModel.eliminar(id);
      res.status(200).json({ mensaje: "Proveedor eliminado con éxito" });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProveedoresController();