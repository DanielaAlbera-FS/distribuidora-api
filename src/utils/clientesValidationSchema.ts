// Esquemas de validación de clientes (express-validator): se usan con checkSchema en las rutas.
import type { Schema } from "express-validator";

// CUIL/CUIT con o sin guiones: debe tener 11 números (la misma regla que ya usaba el controller).
const esCuit = (valor: unknown): boolean =>
  typeof valor === "string" && /^\d{11}$/.test(valor.trim().replace(/-/g, ""));

// El :id de la URL tiene que ser un entero positivo.
export const idValidationSchema: Schema = {
  id: {
    in: ["params"],
    isInt: {
      options: { min: 1, max: 2147483647 },
      errorMessage: "El ID debe ser un número entero positivo",
    },
  },
};

// Cuerpo completo del cliente (POST y PUT): nombre, email y CUIL_CUIT son obligatorios.
export const clienteValidationSchema: Schema = {
  nombre: {
    in: ["body"],
    isString: { errorMessage: "El nombre es obligatorio y debe ser un texto", bail: true },
    trim: true,
    notEmpty: { errorMessage: "El nombre es obligatorio", bail: true },
    isLength: {
      options: { max: 100 },
      errorMessage: "El nombre no puede superar los 100 caracteres",
    },
  },
  email: {
    in: ["body"],
    isString: { errorMessage: "El email es obligatorio y debe ser un texto", bail: true },
    trim: true,
    notEmpty: { errorMessage: "El email es obligatorio", bail: true },
    isEmail: { errorMessage: "El email debe tener un formato válido", bail: true },
    isLength: {
      options: { max: 100 },
      errorMessage: "El email no puede superar los 100 caracteres",
    },
  },
  CUIL_CUIT: {
    in: ["body"],
    custom: {
      options: esCuit,
      errorMessage: "El CUIL/CUIT es obligatorio y debe tener 11 números (se admiten guiones)",
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