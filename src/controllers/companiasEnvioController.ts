// Controller de compañías de envío: valida datos, aplica el modelo y responde HTTP[cite: 1, 5].
import type { Request, Response, NextFunction } from "express";
import companiasEnvioModel from "../models/companiasEnvioModel.js";
import type { DatosCompaniaEnvio, DatosCompaniaEnvioActualizar } from "../models/companiasEnvioModel.js";

type Cuerpo = Record<string, any>;

const aId = (valor: unknown): number => {
  if (typeof valor === "string" && /^\d+$/.test(valor)) return Number(valor);
  return NaN;
};
const idValido = (id: number): boolean => Number.isInteger(id) && id > 0 && id <= 2147483647;

const validarCompaniaEnvio = (datos: Cuerpo): string | null => {
  const { nombre, telefono } = datos;

  if (!nombre || typeof nombre !== "string" || !nombre.trim() || nombre.trim().length > 100) {
    return "El nombre es obligatorio y debe tener entre 1 y 100 caracteres";
  }
  if (telefono !== undefined && telefono !== null && String(telefono).trim().length > 20) {
    return "El teléfono no puede superar los 20 caracteres";
  }
  return null;
};

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
  // GET /companias-envio?nombre=...
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

  // GET /companias-envio/:id
  async consultarDetalle(req: Request, res: Response, next: NextFunction) {
    try {
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const compania = await companiasEnvioModel.obtenerPorId(id);
      if (!compania) {
        return res.status(404).json({ error: "Compañía de envío no encontrada" });
      }

      res.status(200).json(compania);
    } catch (error) {
      next(error);
    }
  }

  // POST /companias-envio
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const datos: Cuerpo = req.body ?? {};
      const errorValidacion = validarCompaniaEnvio(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const compania = await companiasEnvioModel.crear(limpiarCompaniaEnvio(datos));
      res.status(201).json({ mensaje: "Compañía de envío creada con éxito", id: compania.id });
    } catch (error) {
      next(error);
    }
  }

  // PUT /companias-envio/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const datos: Cuerpo = req.body ?? {};
      const errorValidacion = validarCompaniaEnvio(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const compania = await companiasEnvioModel.actualizar(id, limpiarCompaniaEnvio(datos));
      res.status(200).json({ mensaje: "Compañía de envío actualizada con éxito", compania });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /companias-envio/:id
  async actualizarParte(req: Request, res: Response, next: NextFunction) {
    try {
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const campos: Cuerpo = req.body ?? {};
      const camposPermitidos = ["nombre", "telefono"];
      const keys = Object.keys(campos).filter((key) => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: "No se enviaron campos válidos para actualizar" });
      }

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

  // DELETE /companias-envio/:id
  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      await companiasEnvioModel.eliminar(id);
      res.status(200).json({ mensaje: "Compañía de envío eliminada con éxito" });
    } catch (error) {
      next(error); // P2025 si no existe (404), P2003 si tiene pedidos asociados (400)[cite: 1]
    }
  }
}

export default new CompaniasEnvioController();