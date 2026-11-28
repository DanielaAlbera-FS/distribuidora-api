// Controller de comprobantes: revisa la validación, llama al model y arma la respuesta HTTP.
import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import comprobantesModel from "../models/comprobantesModel.js";
import pedidosModel from "../models/pedidosModel.js";

// Revisa lo que dejó el checkSchema de la ruta (patrón de la clase: validationResult).
// Devuelve el cuerpo de la respuesta 400 si hubo errores, o null si todo está bien.
const errorDeValidacion = (req: Request) => {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return null;
  const errores = resultado.array();
  return { error: String(errores[0]?.msg), errores }; // "error" con el primer mensaje, como el resto de la API
};

class ComprobantesController {
  // GET /pedidos/:id/comprobante
  async consultar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por el esquema

      if (!(await pedidosModel.existe(id))) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      const factura = await comprobantesModel.obtenerFactura(id);
      if (factura === null) {
        return res.status(404).json({ error: "El pedido no tiene comprobante emitido" });
      }

      res.status(200).json(factura);
    } catch (error) {
      next(error);
    }
  }

  // POST /pedidos/:id/comprobante
  async emitir(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por el esquema

      // El model revisa todo (pedido, cliente, líneas, emisor) y devuelve el motivo si no se puede emitir.
      const impedimento = await comprobantesModel.verificarEmision(id);
      if (impedimento) {
        return res.status(impedimento.estado).json({ error: impedimento.error });
      }

      await comprobantesModel.emitir(id); // si dos emisiones chocan por el mismo pedido: P2002 -> 400
      const factura = await comprobantesModel.obtenerFactura(id);

      res.status(201).json({ mensaje: "Factura A emitida con éxito", factura });
    } catch (error) {
      next(error);
    }
  }
}

export default new ComprobantesController();