// Rutas del recurso pedidos y de su detalle.
// Este archivo solo asocia cada método y ruta con su función del controlador.
import express from 'express';
import pedidosController from '../controllers/pedidosController.mjs';

const router = express.Router();

router.get('/', pedidosController.consultar);

router.post('/', pedidosController.ingresar);

router.route('/:id')
  .get(pedidosController.consultarDetalle)
  .put(pedidosController.actualizar)
  .delete(pedidosController.eliminar);

router.get('/:id/total', pedidosController.consultarTotal);

router.route('/:id/detalle')
  .get(pedidosController.consultarLineas)
  .post(pedidosController.ingresarLinea);

router.route('/:id/detalle/:id_producto')
  .put(pedidosController.actualizarLinea)
  .delete(pedidosController.eliminarLinea);

export default router;