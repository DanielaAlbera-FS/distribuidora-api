import express from "express";
import { checkSchema } from "express-validator";
import companiasEnvioController from "../controllers/companiasEnvioController.js";
import { companiaEnvioValidationSchema } from "../utils/companiasEnvioValidationSchema.js";
import { idValidationSchema } from "../utils/clientesValidationSchema.js";

const router = express.Router();

router.get("/", companiasEnvioController.consultar);
router.post("/", checkSchema(companiaEnvioValidationSchema, ["body"]), companiasEnvioController.crear);

router
  .route("/:id")
  .get(checkSchema(idValidationSchema, ["params"]), companiasEnvioController.consultarDetalle)
  .put(
    checkSchema(idValidationSchema, ["params"]),
    checkSchema(companiaEnvioValidationSchema, ["body"]),
    companiasEnvioController.actualizar
  )
  .patch(checkSchema(idValidationSchema, ["params"]), companiasEnvioController.actualizarParte)
  .delete(checkSchema(idValidationSchema, ["params"]), companiasEnvioController.eliminar);

export default router;