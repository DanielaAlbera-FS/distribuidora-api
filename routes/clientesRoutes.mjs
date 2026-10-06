//====================== Recursos ============================================
import express from "express";
import clientesController from '../controllers/clientesController.mjs'

const router = express.Router();

//===================== Endpoints =============================================

// Solicitudes sin parámetros
router.get('/', clientesController.consultar)
router.post('/', clientesController.crear)

// Solicitudes con parámetros
router.route("/:id")
  .get(clientesController.consultarDetalle)
  .put(clientesController.actualizar)
  .patch(clientesController.actualizarParte)
  .delete(clientesController.eliminar)

export default router