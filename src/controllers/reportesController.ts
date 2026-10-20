// Controller de reportes: llama al model y arma la respuesta HTTP. No sabe que por debajo hay SQL crudo.
import type { Request, Response, NextFunction } from "express";
import reportesModel from "../models/reportesModel.js";

class ReportesController {
  // GET /reportes/compras-por-cliente
  comprasPorCliente = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reporte = await reportesModel.comprasPorCliente();
      res.status(200).json({ total_clientes: reporte.length, reporte });
    } catch (error) {
      next(error); // el middleware global lo traduce a un JSON controlado
    }
  };
}

export default new ReportesController();