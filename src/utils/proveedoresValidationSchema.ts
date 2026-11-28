// Esquema de validación de proveedores (express-validator): se usa con checkSchema en las rutas.
// El esquema del :id (idValidationSchema) se reutiliza del archivo de clientes.
import type { Schema } from "express-validator";
import { esCodigoPostal } from "./clientesValidationSchema.js"; // misma regla de código postal que clientes

// Mensajes: son los mismos que ya devolvía el controller con la validación manual.
const MSG_NOMBRE = "El nombre es obligatorio y debe tener entre 1 y 100 caracteres";
const MSG_EMAIL = "El email es obligatorio y debe tener un formato válido";
const MSG_CUIT = "El CUIT es obligatorio y debe tener 11 números (se admiten guiones)";

// CUIT con o sin guiones: debe tener 11 números (la misma regla que ya usaba el controller).
const esCuit = (valor: unknown): boolean =>
  typeof valor === "string" && /^\d{11}$/.test(valor.trim().replace(/-/g, ""));

export const MSG_CODIGO_POSTAL = "El código postal debe tener 4 números (por ejemplo 8300) o el formato CPA (por ejemplo R8332ABC)";

// Cuerpo completo del proveedor (POST y PUT): nombre, email y CUIL_CUIT son obligatorios.
// fecha_alta no se valida ni se acepta: la completa la base con la fecha de creación.
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
      errorMessage: MSG_CODIGO_POSTAL,
    },
  },
};
