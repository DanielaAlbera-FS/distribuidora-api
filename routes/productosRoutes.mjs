//====================== Recursos ============================================
import express from "express";
import productosController from '../controllers/productosController.mjs';

const router = express.Router();

//===================== Endpoints =============================================

// Solicitudes sin parámetros
router.get('/', productosController.consultar);
router.post('/', productosController.crear);

// Ruta específica para reportes/agregación
router.get('/resumen', productosController.resumen);

// Solicitudes con parámetros
router.route("/:id")
  .get(productosController.consultarDetalle)
  .put(productosController.actualizar)
  .patch(productosController.actualizarParte)
  .delete(productosController.eliminar);

export default router;