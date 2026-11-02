// Esquemas de validación de productos (express-validator): se usan con checkSchema en las rutas.
import type { Schema } from "express-validator";

const MAX_INT = 2147483647; // Tope de un INT de MySQL.
const MAX_PRECIO = 99999999.99; // Tope de DECIMAL(10,2).

// Convierte a número solo si es number o un string numérico; si no, NaN.
const aNumero = (valor: unknown): number => {
  if (typeof valor === "number") return valor;
  if (typeof valor === "string" && /^\d+(\.\d+)?$/.test(valor.trim())) return Number(valor);
  return NaN;
};

// Entero dentro del rango [minimo, MAX_INT].
const esEntero = (valor: unknown, minimo: number): boolean => {
  const numero = aNumero(valor);
  return Number.isInteger(numero) && numero >= minimo && numero <= MAX_INT;
};

// Precio positivo (mayor a 0) y dentro del tope.
const esPrecioValido = (valor: unknown): boolean => {
  const numero = aNumero(valor);
  return Number.isFinite(numero) && numero > 0 && numero <= MAX_PRECIO;
};

// Mensaje que se devuelve cuando falta alguno de los cuatro campos obligatorios.
const FALTAN_CAMPOS = "Faltan campos obligatorios: nombre, precio, stock e id_proveedor";

// El :id de la URL tiene que ser un entero positivo.
export const idProductoValidationSchema: Schema = {
  id: {
    in: ["params"],
    isInt: {
      options: { min: 1, max: MAX_INT },
      errorMessage: "El ID debe ser un número entero positivo",
    },
  },
};

// Parámetro opcional de GET /productos?stock_max=N
export const stockMaxValidationSchema: Schema = {
  stock_max: {
    in: ["query"],
    optional: true,
    custom: {
      options: (valor: unknown) => esEntero(valor, 0),
      errorMessage: "El parámetro stock_max debe ser un número entero mayor o igual a 0",
    },
  },
};

// Cuerpo completo del producto (POST y PUT): los cuatro campos son obligatorios.
export const productoValidationSchema: Schema = {
  nombre: {
    in: ["body"],
    exists: { errorMessage: FALTAN_CAMPOS, bail: true },
    isString: { errorMessage: "El nombre debe ser un texto de 1 a 100 caracteres", bail: true },
    trim: true,
    isLength: {
      options: { min: 1, max: 100 },
      errorMessage: "El nombre debe ser un texto de 1 a 100 caracteres",
    },
  },
  precio: {
    in: ["body"],
    exists: { errorMessage: FALTAN_CAMPOS, bail: true },
    custom: {
      options: esPrecioValido,
      errorMessage: "El precio debe ser un número positivo mayor a 0",
    },
  },
  stock: {
    in: ["body"],
    exists: { errorMessage: FALTAN_CAMPOS, bail: true },
    custom: {
      options: (valor: unknown) => esEntero(valor, 0),
      errorMessage: "El stock debe ser un número entero mayor o igual a 0",
    },
  },
  id_proveedor: {
    in: ["body"],
    exists: { errorMessage: FALTAN_CAMPOS, bail: true },
    custom: {
      options: (valor: unknown) => esEntero(valor, 1),
      errorMessage: "El id_proveedor debe ser un número entero positivo",
    },
  },
};