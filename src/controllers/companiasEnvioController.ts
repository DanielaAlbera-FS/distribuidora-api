// Controller de compañías de envío: revisa el resultado de la validación, llama al model y arma la respuesta HTTP.
import type { Request, Response, NextFunction } from "express";
import { validationResult, matchedData } from "express-validator";
import companiasEnvioModel from "../models/companiasEnvioModel.js";
import type { DatosCompaniaEnvio, DatosCompaniaEnvioActualizar } from "../models/companiasEnvioModel.js";

// Cuerpo de la petición: llega sin tipo, así que lo tratamos como un objeto cualquiera.
type Cuerpo = Record<string, any>;

// Revisa lo que dejó el checkSchema de la ruta (patrón de la clase: validationResult).
// Devuelve el cuerpo de la respuesta 400 si hubo errores, o null si todo está bien.
const errorDeValidacion = (req: Request) => {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return null;
  const errores = resultado.array();
  return { error: String(errores[0]?.msg), errores }; // "error" con el primer mensaje, como el resto de la API
};

// Arma el objeto limpio (texto sin espacios sobrantes) agregando solo las propiedades presentes.
const limpiarCompaniaEnvio = (datos: Cuerpo): DatosCompaniaEnvio => {
  const objetoLimpio: DatosCompaniaEnvio = {
    nombre: String(datos.nombre).trim(),
  };

  if (datos.telefono !== undefined && datos.telefono !== null && datos.telefono !== "") {
    objetoLimpio.telefono = String(datos.telefono).trim();
  }
  return objetoLimpio;
};

class CompaniasEnvioController {
  // GET /companias_envio?nombre=...
  async consultar(req: Request, res: Response, next: NextFunction) {
    try {
      const { nombre } = req.query;

      if (nombre !== undefined && (typeof nombre !== "string" || nombre.trim() === "")) {
        return res.status(400).json({ error: "El parámetro nombre debe ser un texto no vacío" });
      }

      const companias = await companiasEnvioModel.obtenerTodas(nombre?.trim());
      res.status(200).json({ total: companias.length, companias });
    } catch (error) {
      next(error);
    }
  }

  // GET /companias_envio/:id
  async consultarDetalle(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      const compania = await companiasEnvioModel.obtenerPorId(id);
      if (!compania) {
        return res.status(404).json({ error: "Compañía de envío no encontrada" });
      }

      res.status(200).json(compania);
    } catch (error) {
      next(error);
    }
  }

  // POST /companias_envio
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }

      // matchedData devuelve solo los campos del esquema, ya recortados por trim.
      const datos: Cuerpo = matchedData(req, { locations: ["body"] });
      const compania = await companiasEnvioModel.crear(limpiarCompaniaEnvio(datos));

      res.status(201).json({ mensaje: "Compañía de envío creada con éxito", id: compania.id });
    } catch (error) {
      next(error);
    }
  }

  // PUT /companias_envio/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      // matchedData devuelve solo los campos del esquema, ya recortados por trim.
      const datos: Cuerpo = matchedData(req, { locations: ["body"] });
      const compania = await companiasEnvioModel.actualizar(id, limpiarCompaniaEnvio(datos));

      res.status(200).json({ mensaje: "Compañía de envío actualizada con éxito", compania });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /companias_envio/:id
  async actualizarParte(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      const campos: Cuerpo = req.body ?? {};
      const camposPermitidos = ["nombre", "telefono"];
      const keys = Object.keys(campos).filter((key) => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: "No se enviaron campos válidos para actualizar" });
      }

      // Los campos, si llegan, deben seguir siendo válidos.
      if (campos.nombre !== undefined && (typeof campos.nombre !== "string" || !campos.nombre.trim() || campos.nombre.trim().length > 100)) {
        return res.status(400).json({ error: "El nombre debe ser un texto de 1 a 100 caracteres" });
      }
      if (campos.telefono !== undefined && campos.telefono !== null && String(campos.telefono).trim().length > 20) {
        return res.status(400).json({ error: "El teléfono no puede superar los 20 caracteres" });
      }

      const datos: DatosCompaniaEnvioActualizar = {};
      if (campos.nombre !== undefined) datos.nombre = String(campos.nombre).trim();
      if (campos.telefono !== undefined) datos.telefono = campos.telefono === null ? null : String(campos.telefono).trim();

      const compania = await companiasEnvioModel.actualizarParte(id, datos);
      res.status(200).json({ mensaje: "Compañía de envío actualizada parcialmente con éxito", compania });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /companias_envio/:id
  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      await companiasEnvioModel.eliminar(id); // P2025 si no existe (404), P2003 si tiene pedidos asociados (400)
      res.status(200).json({ mensaje: "Compañía de envío eliminada con éxito" });
    } catch (error) {
      next(error);
    }
  }
}

export default new CompaniasEnvioController();