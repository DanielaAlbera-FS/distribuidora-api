import express from "express";
import proveedoresController from "../controllers/proveedoresController.js";

const router = express.Router();

// Rutas sin parámetros
router.get("/", proveedoresController.consultar);
router.post("/", proveedoresController.crear);

// Rutas con parámetro :id
router
  .route("/:id")
  .get(proveedoresController.consultarDetalle)
  .put(proveedoresController.actualizar)
  .patch(proveedoresController.actualizarParte)
  .delete(proveedoresController.eliminar);

export default router;