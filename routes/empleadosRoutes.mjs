//====================== Recursos ============================================
import express from "express";
import empleadosController from '../controllers/empleadosController.mjs'

const router = express.Router();

//===================== Endpoints =============================================

// Solicitudes sin parámetros
router.get('/', empleadosController.consultar)
router.post('/', empleadosController.crear)

// Solicitudes con parámetros
router.route("/:id")
  .get(empleadosController.consultarDetalle)
  .put(empleadosController.actualizar)
  .patch(empleadosController.actualizarParte)
  .delete(empleadosController.eliminar)

export default router