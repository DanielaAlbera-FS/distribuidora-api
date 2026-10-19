// Router de productos: asocia cada método HTTP y ruta con un método del controller.
import express from "express";
import productosController from "../controllers/productosController.js";

const router = express.Router();

// Rutas sin parámetros: /productos
router.get("/", productosController.consultar);
router.post("/", productosController.crear);

// Rutas con parámetro: /productos/:id
router.route("/:id")
  .get(productosController.consultarDetalle)
  .put(productosController.actualizar)
  .patch(productosController.actualizarParte)
  .delete(productosController.eliminar);

export default router;
