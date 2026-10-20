import express from "express";
import empleadosController from "../controllers/empleadosController.js";

const router = express.Router();

// Endpoints sin ID
router.get("/", empleadosController.consultar);
router.post("/", empleadosController.crear);

// Endpoints con ID
router
  .route("/:id")
  .get(empleadosController.consultarDetalle)
  .put(empleadosController.actualizar)
  .patch(empleadosController.actualizarParte)
  .delete(empleadosController.eliminar);

export default router;