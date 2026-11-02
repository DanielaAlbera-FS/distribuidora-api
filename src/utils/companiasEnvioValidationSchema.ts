// Esquema de validación de compañías de envío (express-validator): se usa con checkSchema en las rutas.
// El esquema del :id (idValidationSchema) se reutiliza del archivo de clientes.
import type { Schema } from "express-validator";

// Mensaje: es el mismo que ya devolvía el controller con la validación manual.
const MSG_NOMBRE = "El nombre es obligatorio y debe tener entre 1 y 100 caracteres";

// Cuerpo completo de la compañía (POST y PUT): solo el nombre es obligatorio.
export const companiaEnvioValidationSchema: Schema = {
  nombre: {
    in: ["body"],
    isString: { errorMessage: MSG_NOMBRE, bail: true },
    trim: true,
    notEmpty: { errorMessage: MSG_NOMBRE, bail: true },
    isLength: {
      options: { max: 100 },
      errorMessage: MSG_NOMBRE,
    },
  },
  telefono: {
    in: ["body"],
    optional: true,
    isLength: {
      options: { max: 20 },
      errorMessage: "El teléfono no puede superar los 20 caracteres",
    },
  },
};