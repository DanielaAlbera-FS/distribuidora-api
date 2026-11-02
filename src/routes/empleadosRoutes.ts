import express from "express";
import { checkSchema } from "express-validator";
import empleadosController from "../controllers/empleadosController.js";
import { empleadoValidationSchema } from "../utils/empleadosValidationSchema.js";
import { idValidationSchema } from "../utils/clientesValidationSchema.js";

const router = express.Router();

// Endpoints sin ID
router.get("/", empleadosController.consultar);
router.post("/", checkSchema(empleadoValidationSchema, ["body"]), empleadosController.crear);

// Endpoints con ID
router
  .route("/:id")
  .get(checkSchema(idValidationSchema, ["params"]), empleadosController.consultarDetalle)
  .put(
    checkSchema(idValidationSchema, ["params"]),
    checkSchema(empleadoValidationSchema, ["body"]),
    empleadosController.actualizar
  )
  .patch(checkSchema(idValidationSchema, ["params"]), empleadosController.actualizarParte)
  .delete(checkSchema(idValidationSchema, ["params"]), empleadosController.eliminar);

export default router;