//====================== Recursos ============================================
import express from "express";
import proveedoresController from '../controllers/proveedoresController.mjs';

const router = express.Router();

//===================== Endpoints =============================================

// Solicitudes sin parámetros
router.get('/', proveedoresController.consultar);
router.post('/', proveedoresController.crear);

// Solicitudes con parámetros
router.route("/:id")
  .get(proveedoresController.consultarDetalle)
  .put(proveedoresController.actualizar)
  .patch(proveedoresController.actualizarParte)
  .delete(proveedoresController.eliminar);

export default router;