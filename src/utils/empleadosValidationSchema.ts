// Esquema de validación de empleados (express-validator): se usa con checkSchema en las rutas.
// El esquema del :id (idValidationSchema) se reutiliza del archivo de clientes.
import type { Schema } from "express-validator";

// Mensajes: son los mismos que ya devolvía el controller con la validación manual.
const MSG_NOMBRE = "El nombre es obligatorio y debe tener entre 1 y 100 caracteres";
const MSG_APELLIDO = "El apellido es obligatorio y debe tener entre 1 y 100 caracteres";
const MSG_EMAIL = "El email es obligatorio y debe tener un formato válido";
export const MSG_FECHA_NACIMIENTO =
  "La fecha de nacimiento debe tener formato AAAA-MM-DD, ser una fecha real y el empleado debe tener entre 16 y 100 años";

// Fecha de nacimiento AAAA-MM-DD que exista de verdad (rechaza 1990-02-31), que no sea futura
// y que dé una edad razonable para un empleado: entre 16 (edad mínima para trabajar) y 100 años.
// Se exporta para que el controller use la misma regla en el PATCH.
export const esFechaNacimiento = (valor: unknown): boolean => {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor.trim())) return false;
  const texto = valor.trim();
  const fecha = new Date(`${texto}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== texto) return false;

  const hoy = new Date();
  const anio = hoy.getUTCFullYear();
  const mes = String(hoy.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getUTCDate()).padStart(2, "0");
  // Comparando textos AAAA-MM-DD alcanza: el orden alfabético coincide con el de las fechas.
  const limiteMasJoven = `${anio - 16}-${mes}-${dia}`; // nacido como mucho hace 16 años
  const limiteMasViejo = `${anio - 100}-${mes}-${dia}`; // nacido como poco hace 100 años
  return texto <= limiteMasJoven && texto >= limiteMasViejo;
};

// Cuerpo completo del empleado (POST y PUT): nombre, apellido y email son obligatorios.
// fecha_alta no se valida ni se acepta: la completa la base con la fecha de creación.
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
  fecha_nacimiento: {
    in: ["body"],
    optional: { options: { values: "null" } },
    isString: { errorMessage: MSG_FECHA_NACIMIENTO, bail: true },
    trim: true,
    custom: {
      // Vacío se admite (se descarta como los demás opcionales); si trae algo, debe ser una fecha válida.
      options: (valor: unknown) => valor === "" || esFechaNacimiento(valor),
      errorMessage: MSG_FECHA_NACIMIENTO,
    },
  },
};
