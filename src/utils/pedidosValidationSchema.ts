// Esquemas de validación de pedidos y de su detalle (express-validator): se usan con checkSchema en las rutas.
import type { Schema } from "express-validator";

const MAX_INT = 2147483647; // Tope de un INT de MySQL.
const MAX_PRECIO = 99999999.99; // Tope de DECIMAL(10,2).
const ESTADOS_VALIDOS = ["pendiente", "enviado", "entregado"]; // Los tres estados del enum.

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

// Fecha AAAA-MM-DD que exista de verdad (rechaza, por ejemplo, 2026-02-31).
const esFechaValida = (valor: unknown): boolean => {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};

// Uno de los tres estados del enum.
const esEstado = (valor: unknown): boolean =>
  typeof valor === "string" && ESTADOS_VALIDOS.includes(valor);

// Mensajes que se repiten en varios esquemas.
const FALTAN_CAMPOS_PEDIDO = "Faltan campos obligatorios: fecha, estado, id_cliente, id_empleado e id_compania_envio";
const MSG_FECHA = "La fecha debe ser válida y tener formato AAAA-MM-DD";
const MSG_ESTADO = `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`;
const FALTAN_CAMPOS_LINEA = "Faltan campos obligatorios: cantidad y precio_unitario";

// El :id del pedido en la URL tiene que ser un entero positivo.
export const idPedidoValidationSchema: Schema = {
  id: {
    in: ["params"],
    isInt: {
      options: { min: 1, max: MAX_INT },
      errorMessage: "El ID debe ser un número entero positivo",
    },
  },
};

// Rutas /pedidos/:id/detalle/:id_producto: los dos ids de la URL tienen que ser enteros positivos.
export const idLineaValidationSchema: Schema = {
  id: {
    in: ["params"],
    isInt: {
      options: { min: 1, max: MAX_INT },
      errorMessage: "El ID del pedido y el ID del producto deben ser enteros positivos",
    },
  },
  id_producto: {
    in: ["params"],
    isInt: {
      options: { min: 1, max: MAX_INT },
      errorMessage: "El ID del pedido y el ID del producto deben ser enteros positivos",
    },
  },
};

// Parámetros opcionales de GET /pedidos?estado=&fecha=
export const consultaPedidosValidationSchema: Schema = {
  estado: {
    in: ["query"],
    optional: true,
    custom: { options: esEstado, errorMessage: MSG_ESTADO },
  },
  fecha: {
    in: ["query"],
    optional: true,
    custom: { options: esFechaValida, errorMessage: MSG_FECHA },
  },
};

// Cuerpo del pedido para POST: el estado es opcional (si no llega, arranca como "pendiente").
export const pedidoValidationSchema: Schema = {
  fecha: {
    in: ["body"],
    exists: { errorMessage: FALTAN_CAMPOS_PEDIDO, bail: true },
    custom: { options: esFechaValida, errorMessage: MSG_FECHA },
  },
  estado: {
    in: ["body"],
    optional: true,
    custom: { options: esEstado, errorMessage: MSG_ESTADO },
  },
  id_cliente: {
    in: ["body"],
    exists: { errorMessage: FALTAN_CAMPOS_PEDIDO, bail: true },
    custom: {
      options: (valor: unknown) => esEntero(valor, 1),
      errorMessage: "El id_cliente debe ser un número entero positivo",
    },
  },
  id_empleado: {
    in: ["body"],
    exists: { errorMessage: FALTAN_CAMPOS_PEDIDO, bail: true },
    custom: {
      options: (valor: unknown) => esEntero(valor, 1),
      errorMessage: "El id_empleado debe ser un número entero positivo",
    },
  },
  id_compania_envio: {
    in: ["body"],
    exists: { errorMessage: FALTAN_CAMPOS_PEDIDO, bail: true },
    custom: {
      options: (valor: unknown) => esEntero(valor, 1),
      errorMessage: "El id_compania_envio debe ser un número entero positivo",
    },
  },
};

// Cuerpo del pedido para PUT: igual que el de POST, pero el estado es obligatorio.
export const pedidoCompletoValidationSchema: Schema = {
  ...pedidoValidationSchema,
  estado: {
    in: ["body"],
    exists: { errorMessage: FALTAN_CAMPOS_PEDIDO, bail: true },
    custom: { options: esEstado, errorMessage: MSG_ESTADO },
  },
};

// Cantidad y precio de una línea del detalle. Son las reglas que antes imponían los CHECK de la base.
const cantidadYPrecio: Schema = {
  cantidad: {
    in: ["body"],
    exists: { errorMessage: FALTAN_CAMPOS_LINEA, bail: true },
    custom: {
      options: (valor: unknown) => esEntero(valor, 1),
      errorMessage: "La cantidad debe ser un número entero positivo",
    },
  },
  precio_unitario: {
    in: ["body"],
    exists: { errorMessage: FALTAN_CAMPOS_LINEA, bail: true },
    custom: {
      options: esPrecioValido,
      errorMessage: "El precio_unitario debe ser un número positivo",
    },
  },
};

// POST /pedidos/:id/detalle: además de cantidad y precio, hay que indicar el producto.
export const lineaValidationSchema: Schema = {
  id_producto: {
    in: ["body"],
    exists: {
      errorMessage: "Faltan campos obligatorios: id_producto, cantidad y precio_unitario",
      bail: true,
    },
    custom: {
      options: (valor: unknown) => esEntero(valor, 1),
      errorMessage: "El id_producto debe ser un número entero positivo",
    },
  },
  ...cantidadYPrecio,
};

// PUT /pedidos/:id/detalle/:id_producto: el producto viene en la URL, en el cuerpo solo cantidad y precio.
export const lineaActualizarValidationSchema: Schema = cantidadYPrecio;