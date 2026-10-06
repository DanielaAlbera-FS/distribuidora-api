//====================== Recursos ============================================
import express from "express";
import companiasEnvioController from '../controllers/companiasEnvioController.mjs';

const router = express.Router();

//===================== Endpoints =============================================

// Solicitudes sin parámetros
router.get('/', companiasEnvioController.consultar);
router.post('/', companiasEnvioController.crear);

// Solicitudes con parámetros
router.route("/:id")
  .get(companiasEnvioController.consultarDetalle)
  .put(companiasEnvioController.actualizar)
  .patch(companiasEnvioController.actualizarParte)
  .delete(companiasEnvioController.eliminar);

export default router;