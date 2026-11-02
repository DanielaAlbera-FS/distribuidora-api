// Esquema de validación de proveedores (express-validator): se usa con checkSchema en las rutas.
// El esquema del :id (idValidationSchema) se reutiliza del archivo de clientes.
import type { Schema } from "express-validator";

// Mensajes: son los mismos que ya devolvía el controller con la validación manual.
const MSG_NOMBRE = "El nombre es obligatorio y debe tener entre 1 y 100 caracteres";
const MSG_EMAIL = "El email es obligatorio y debe tener un formato válido";
const MSG_CUIT = "El CUIT es obligatorio y debe tener 11 números (se admiten guiones)";

// CUIT con o sin guiones: debe tener 11 números (la misma regla que ya usaba el controller).
const esCuit = (valor: unknown): boolean =>
  typeof valor === "string" && /^\d{11}$/.test(valor.trim().replace(/-/g, ""));

// Cuerpo completo del proveedor (POST y PUT): nombre, email y CUIL_CUIT son obligatorios.
export const proveedorValidationSchema: Schema = {
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
  CUIL_CUIT: {
    in: ["body"],
    custom: {
      options: esCuit,
      errorMessage: MSG_CUIT,
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
  direccion: {
    in: ["body"],
    optional: true,
    isLength: {
      options: { max: 150 },
      errorMessage: "La dirección no puede superar los 150 caracteres",
    },
  },
};