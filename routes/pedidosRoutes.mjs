import express from 'express';
import pedidosController from '../controllers/pedidosController.mjs';

const router = express.Router();

//===================== Endpoints =============================================

// Pedidos generales
router.get('/', pedidosController.consultar);
router.post('/', pedidosController.crear);

// Total de un pedido específico
router.get('/:id/total', pedidosController.consultarTotal);

// Pedido por ID
router.route('/:id')
  .get(pedidosController.consultarDetalle)
  .put(pedidosController.actualizar)
  .patch(pedidosController.actualizarParte)
  .delete(pedidosController.eliminar);

// Detalle completo del pedido
router.route('/:id/detalle')
  .get(pedidosController.consultarLineas)
  .post(pedidosController.ingresarLinea);

// Gestión de ítems individuales dentro del detalle
router.route('/:id/detalle/:id_producto')
  .put(pedidosController.actualizarLinea)
  .delete(pedidosController.eliminarLinea);

export default router;