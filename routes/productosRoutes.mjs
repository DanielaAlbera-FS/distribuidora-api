// Rutas del recurso productos.
// Este archivo solo asocia cada método y ruta con su función del controlador.
import express from 'express';
import productosController from '../controllers/productosController.mjs';

const router = express.Router();

// Las rutas fijas se declaran antes que /:id para que "resumen" no se interprete como un id.
router.get('/resumen', productosController.resumen);

router.get('/', productosController.consultar);

router.post('/', productosController.ingresar);

router.route('/:id')
  .get(productosController.consultarDetalle)
  .put(productosController.actualizar)
  .delete(productosController.eliminar);

export default router;