// Router de reportes: asocia cada ruta con un método del controller.
import express from "express";
import reportesController from "../controllers/reportesController.js";

const router = express.Router();

// Informe de compras por cliente: /reportes/compras-por-cliente
router.get("/compras-por-cliente", reportesController.comprasPorCliente);

export default router;