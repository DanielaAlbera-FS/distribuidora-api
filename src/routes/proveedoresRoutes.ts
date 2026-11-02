import express from "express";
import { checkSchema } from "express-validator";
import proveedoresController from "../controllers/proveedoresController.js";
import { proveedorValidationSchema } from "../utils/proveedoresValidationSchema.js";
import { idValidationSchema } from "../utils/clientesValidationSchema.js";

const router = express.Router();

// Rutas sin parámetros
router.get("/", proveedoresController.consultar);
router.post("/", checkSchema(proveedorValidationSchema, ["body"]), proveedoresController.crear);

// Rutas con parámetro :id
router
  .route("/:id")
  .get(checkSchema(idValidationSchema, ["params"]), proveedoresController.consultarDetalle)
  .put(
    checkSchema(idValidationSchema, ["params"]),
    checkSchema(proveedorValidationSchema, ["body"]),
    proveedoresController.actualizar
  )
  .patch(checkSchema(idValidationSchema, ["params"]), proveedoresController.actualizarParte)
  .delete(checkSchema(idValidationSchema, ["params"]), proveedoresController.eliminar);

export default router;