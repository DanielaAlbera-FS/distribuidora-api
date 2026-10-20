// Router de pedidos: asocia cada método HTTP y ruta con un método del controller.
import express from "express";
import pedidosController from "../controllers/pedidosController.js";

const router = express.Router();

// Rutas sin parámetros: /pedidos
router.get("/", pedidosController.consultar);
router.post("/", pedidosController.crear);

// Total de un pedido. Tiene más segmentos que /:id, así que no se confunde con él.
router.get("/:id/total", pedidosController.consultarTotal);

// Rutas con parámetro: /pedidos/:id
router.route("/:id")
  .get(pedidosController.consultarDetalle)
  .put(pedidosController.actualizar)
  .patch(pedidosController.actualizarParte)
  .delete(pedidosController.eliminar);

// Detalle del pedido: sus líneas.
router.route("/:id/detalle")
  .get(pedidosController.consultarLineas)
  .post(pedidosController.ingresarLinea);

// Una línea puntual del detalle, identificada por el id del pedido y el id del producto.
router.route("/:id/detalle/:id_producto")
  .put(pedidosController.actualizarLinea)
  .delete(pedidosController.eliminarLinea);

export default router;