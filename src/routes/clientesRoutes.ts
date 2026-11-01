import express from "express";
import { checkSchema } from "express-validator";
import clientesController from "../controllers/clientesController.js";
import { clienteValidationSchema, idValidationSchema } from "../utils/clientesValidationSchema.js";

const router = express.Router();

// Rutas sin parámetros (/clientes)
router.get("/", clientesController.consultar);
router.post("/", checkSchema(clienteValidationSchema, ["body"]), clientesController.crear);

// Rutas con parámetro (/clientes/:id)
router
  .route("/:id")
  .get(checkSchema(idValidationSchema, ["params"]), clientesController.consultarDetalle)
  .put(
    checkSchema(idValidationSchema, ["params"]),
    checkSchema(clienteValidationSchema, ["body"]),
    clientesController.actualizar
  )
  .patch(checkSchema(idValidationSchema, ["params"]), clientesController.actualizarParte)
  .delete(checkSchema(idValidationSchema, ["params"]), clientesController.eliminar);

export default router;