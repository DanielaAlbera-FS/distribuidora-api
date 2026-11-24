// Esquemas de validación de clientes (express-validator): se usan con checkSchema en las rutas.
import type { Schema } from "express-validator";

// CUIL/CUIT con o sin guiones: debe tener 11 números (la misma regla que ya usaba el controller).
const esCuit = (valor: unknown): boolean =>
  typeof valor === "string" && /^\d{11}$/.test(valor.trim().replace(/-/g, ""));

// Código postal argentino: el de 4 números (8300) o el CPA de 8 caracteres (R8332ABC).
// Se exporta para que el controller use la misma regla en el PATCH.
export const esCodigoPostal = (valor: unknown): boolean =>
  typeof valor === "string" && /^(\d{4}|[A-Za-z]\d{4}[A-Za-z]{3})$/.test(valor.trim());

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
// fecha_alta no se valida ni se acepta: la completa la base con la fecha de creación.
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
  localidad: {
    in: ["body"],
    optional: { options: { values: "null" } }, // si no viene (o viene null) no se valida
    isString: { errorMessage: "La localidad debe ser un texto", bail: true },
    trim: true,
    isLength: {
      options: { max: 100 },
      errorMessage: "La localidad no puede superar los 100 caracteres",
    },
  },
  provincia: {
    in: ["body"],
    optional: { options: { values: "null" } },
    isString: { errorMessage: "La provincia debe ser un texto", bail: true },
    trim: true,
    isLength: {
      options: { max: 100 },
      errorMessage: "La provincia no puede superar los 100 caracteres",
    },
  },
  codigo_postal: {
    in: ["body"],
    optional: { options: { values: "null" } },
    isString: { errorMessage: "El código postal debe ser un texto", bail: true },
    trim: true,
    custom: {
      // Vacío se admite (se descarta como los demás opcionales); si trae algo, debe ser un código válido.
      options: (valor: unknown) => valor === "" || esCodigoPostal(valor),
      errorMessage: "El código postal debe tener 4 números (por ejemplo 8300) o el formato CPA (por ejemplo R8332ABC)",
    },
  },
};