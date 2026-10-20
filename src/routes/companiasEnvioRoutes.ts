import express from "express";
import companiasEnvioController from "../controllers/companiasEnvioController.js";

const router = express.Router();

router.get("/", companiasEnvioController.consultar);
router.post("/", companiasEnvioController.crear);

router
  .route("/:id")
  .get(companiasEnvioController.consultarDetalle)
  .put(companiasEnvioController.actualizar)
  .patch(companiasEnvioController.actualizarParte)
  .delete(companiasEnvioController.eliminar);

export default router;