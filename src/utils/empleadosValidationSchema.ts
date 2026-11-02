// Esquema de validación de empleados (express-validator): se usa con checkSchema en las rutas.
// El esquema del :id (idValidationSchema) se reutiliza del archivo de clientes.
import type { Schema } from "express-validator";

// Mensajes: son los mismos que ya devolvía el controller con la validación manual.
const MSG_NOMBRE = "El nombre es obligatorio y debe tener entre 1 y 100 caracteres";
const MSG_APELLIDO = "El apellido es obligatorio y debe tener entre 1 y 100 caracteres";
const MSG_EMAIL = "El email es obligatorio y debe tener un formato válido";

// Cuerpo completo del empleado (POST y PUT): nombre, apellido y email son obligatorios.
export const empleadoValidationSchema: Schema = {
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
  apellido: {
    in: ["body"],
    isString: { errorMessage: MSG_APELLIDO, bail: true },
    trim: true,
    notEmpty: { errorMessage: MSG_APELLIDO, bail: true },
    isLength: {
      options: { max: 100 },
      errorMessage: MSG_APELLIDO,
    },
  },
  email: {
    in: ["body"],
    isString: { errorMessage: MSG_EMAIL, bail: true },
    trim: true,
    notEmpty: { errorMessage: MSG_EMAIL, bail: true },
    isEmail: { errorMessage: MSG_EMAIL, bail: true },
    isLength: {
      options: { max: 100 },
      errorMessage: MSG_EMAIL,
    },
  },
  cargo: {
    in: ["body"],
    optional: true,
    isLength: {
      options: { max: 50 },
      errorMessage: "El cargo no puede superar los 50 caracteres",
    },
  },
};