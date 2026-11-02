// Router de pedidos: asocia cada método HTTP y ruta con un método del controller.
import express from "express";
import { checkSchema } from "express-validator";
import pedidosController from "../controllers/pedidosController.js";
import {
  consultaPedidosValidationSchema,
  idLineaValidationSchema,
  idPedidoValidationSchema,
  lineaActualizarValidationSchema,
  lineaValidationSchema,
  pedidoCompletoValidationSchema,
  pedidoValidationSchema,
} from "../utils/pedidosValidationSchema.js";

const router = express.Router();

// Rutas sin parámetros: /pedidos
router.get("/", checkSchema(consultaPedidosValidationSchema, ["query"]), pedidosController.consultar);
router.post("/", checkSchema(pedidoValidationSchema, ["body"]), pedidosController.crear);

// Total de un pedido. Tiene más segmentos que /:id, así que no se confunde con él.
router.get("/:id/total", checkSchema(idPedidoValidationSchema, ["params"]), pedidosController.consultarTotal);

// Rutas con parámetro: /pedidos/:id
router.route("/:id")
  .get(checkSchema(idPedidoValidationSchema, ["params"]), pedidosController.consultarDetalle)
  .put(
    checkSchema(idPedidoValidationSchema, ["params"]),
    checkSchema(pedidoCompletoValidationSchema, ["body"]),
    pedidosController.actualizar
  )
  .patch(checkSchema(idPedidoValidationSchema, ["params"]), pedidosController.actualizarParte)
  .delete(checkSchema(idPedidoValidationSchema, ["params"]), pedidosController.eliminar);

// Detalle del pedido: sus líneas.
router.route("/:id/detalle")
  .get(checkSchema(idPedidoValidationSchema, ["params"]), pedidosController.consultarLineas)
  .post(
    checkSchema(idPedidoValidationSchema, ["params"]),
    checkSchema(lineaValidationSchema, ["body"]),
    pedidosController.ingresarLinea
  );

// Una línea puntual del detalle, identificada por el id del pedido y el id del producto.
router.route("/:id/detalle/:id_producto")
  .put(
    checkSchema(idLineaValidationSchema, ["params"]),
    checkSchema(lineaActualizarValidationSchema, ["body"]),
    pedidosController.actualizarLinea
  )
  .delete(checkSchema(idLineaValidationSchema, ["params"]), pedidosController.eliminarLinea);

export default router;