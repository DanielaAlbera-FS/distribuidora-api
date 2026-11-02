// Router de productos: asocia cada método HTTP y ruta con un método del controller.
import express from "express";
import { checkSchema } from "express-validator";
import productosController from "../controllers/productosController.js";
import {
  idProductoValidationSchema,
  productoValidationSchema,
  stockMaxValidationSchema,
} from "../utils/productosValidationSchema.js";

const router = express.Router();

// Rutas sin parámetros: /productos
router.get("/", checkSchema(stockMaxValidationSchema, ["query"]), productosController.consultar);
router.post("/", checkSchema(productoValidationSchema, ["body"]), productosController.crear);

// Reporte de agregación. Va ANTES de /:id para que "resumen" no se tome como un id.
router.get("/resumen", productosController.resumen);

// Rutas con parámetro: /productos/:id
router.route("/:id")
  .get(checkSchema(idProductoValidationSchema, ["params"]), productosController.consultarDetalle)
  .put(
    checkSchema(idProductoValidationSchema, ["params"]),
    checkSchema(productoValidationSchema, ["body"]),
    productosController.actualizar
  )
  .patch(checkSchema(idProductoValidationSchema, ["params"]), productosController.actualizarParte)
  .delete(checkSchema(idProductoValidationSchema, ["params"]), productosController.eliminar);

export default router;