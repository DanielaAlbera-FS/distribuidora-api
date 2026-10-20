import express from "express";
import clientesController from "../controllers/clientesController.js";

const router = express.Router();

// Rutas sin parámetros (/clientes)
router.get("/", clientesController.consultar);
router.post("/", clientesController.crear);

// Rutas con parámetro (/clientes/:id)
router
  .route("/:id")
  .get(clientesController.consultarDetalle)
  .put(clientesController.actualizar)
  .patch(clientesController.actualizarParte)
  .delete(clientesController.eliminar);

export default router;