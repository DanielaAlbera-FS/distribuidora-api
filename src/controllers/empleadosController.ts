// Controller de empleados: revisa el resultado de la validación, llama al model y arma la respuesta HTTP.
import type { Request, Response, NextFunction } from "express";
import { validationResult, matchedData } from "express-validator";
import empleadosModel from "../models/empleadosModel.js";
import type { DatosEmpleado, DatosEmpleadoActualizar } from "../models/empleadosModel.js";
import { esFechaNacimiento, MSG_FECHA_NACIMIENTO } from "../utils/empleadosValidationSchema.js";

// Cuerpo de la petición: llega sin tipo, así que lo tratamos como un objeto cualquiera.
type Cuerpo = Record<string, any>;

// Se sigue usando en el PATCH, cuyos campos del cuerpo se controlan acá.
const esEmailValido = (valor: unknown): boolean => {
  if (typeof valor !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
};

// Revisa lo que dejó el checkSchema de la ruta (patrón de la clase: validationResult).
// Devuelve el cuerpo de la respuesta 400 si hubo errores, o null si todo está bien.
const errorDeValidacion = (req: Request) => {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return null;
  const errores = resultado.array();
  return { error: String(errores[0]?.msg), errores }; // "error" con el primer mensaje, como el resto de la API
};

// Campos opcionales del empleado: se agregan al objeto solo si llegaron con contenido.
// fecha_nacimiento viaja como texto AAAA-MM-DD; el model la convierte a fecha.
const camposOpcionales = ["cargo", "localidad", "provincia", "fecha_nacimiento"] as const;

// Saneamiento de datos antes de enviar al modelo: agrega solo las propiedades presentes.
// fecha_alta nunca se toma del cuerpo: la pone la base (DEFAULT CURRENT_TIMESTAMP).
const limpiarEmpleado = (datos: Cuerpo): DatosEmpleado => {
  const objetoLimpio: DatosEmpleado = {
    nombre: String(datos.nombre).trim(),
    apellido: String(datos.apellido).trim(),
    email: String(datos.email).trim(),
  };

  for (const campo of camposOpcionales) {
    const valor = datos[campo];
    if (valor !== undefined && valor !== null && valor !== "") {
      objetoLimpio[campo] = String(valor).trim();
    }
  }
  return objetoLimpio;
};

// Texto opcional del PATCH: acepta null (para borrar el dato) o un texto de hasta "max" caracteres.
const esTextoOpcionalValido = (valor: unknown, max: number): boolean =>
  valor === null || (typeof valor === "string" && valor.trim().length <= max);

// Fecha de nacimiento opcional del PATCH: null, vacío, o una fecha válida.
const esFechaNacimientoOpcionalValida = (valor: unknown): boolean =>
  valor === null || (typeof valor === "string" && (valor.trim() === "" || esFechaNacimiento(valor)));

// Texto del PATCH a guardar: null o vacío se guardan como null; si no, el texto recortado.
const textoONull = (valor: unknown): string | null =>
  valor === null || String(valor).trim() === "" ? null : String(valor).trim();

class EmpleadosController {
  // GET /empleados?apellido=...
  async consultar(req: Request, res: Response, next: NextFunction) {
    try {
      const { apellido } = req.query;

      if (apellido !== undefined && (typeof apellido !== "string" || apellido.trim() === "")) {
        return res.status(400).json({ error: "El parámetro apellido debe ser un texto no vacío" });
      }

      const empleados = await empleadosModel.obtenerTodos(apellido?.trim());
      res.status(200).json({ total: empleados.length, empleados });
    } catch (error) {
      next(error);
    }
  }

  // GET /empleados/:id
  async consultarDetalle(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      const empleado = await empleadosModel.obtenerPorId(id);
      if (!empleado) {
        return res.status(404).json({ error: "Empleado no encontrado" });
      }

      res.status(200).json(empleado);
    } catch (error) {
      next(error);
    }
  }

  // POST /empleados
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }

      // matchedData devuelve solo los campos del esquema, ya recortados por trim.
      const datos: Cuerpo = matchedData(req, { locations: ["body"] });
      const empleado = await empleadosModel.crear(limpiarEmpleado(datos));

      res.status(201).json({ mensaje: "Empleado creado con éxito", id: empleado.id });
    } catch (error) {
      next(error); // El middleware captura P2002 si el email está duplicado
    }
  }

  // PUT /empleados/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      // matchedData devuelve solo los campos del esquema, ya recortados por trim.
      const datos: Cuerpo = matchedData(req, { locations: ["body"] });
      const empleado = await empleadosModel.actualizar(id, limpiarEmpleado(datos));

      res.status(200).json({ mensaje: "Empleado actualizado con éxito", empleado });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /empleados/:id
  async actualizarParte(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      const campos: Cuerpo = req.body ?? {};
      // fecha_alta no está en la lista: si llega en el cuerpo se ignora (la pone la base).
      const camposPermitidos = ["nombre", "apellido", "email", "cargo", "localidad", "provincia", "fecha_nacimiento"];
      const keys = Object.keys(campos).filter((key) => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: "No se enviaron campos válidos para actualizar" });
      }

      // Los campos, si llegan, deben seguir siendo válidos.
      if (campos.nombre !== undefined && (typeof campos.nombre !== "string" || !campos.nombre.trim() || campos.nombre.trim().length > 100)) {
        return res.status(400).json({ error: "El nombre debe ser un texto de 1 a 100 caracteres" });
      }
      if (campos.apellido !== undefined && (typeof campos.apellido !== "string" || !campos.apellido.trim() || campos.apellido.trim().length > 100)) {
        return res.status(400).json({ error: "El apellido debe ser un texto de 1 a 100 caracteres" });
      }
      if (campos.email !== undefined && !esEmailValido(campos.email)) {
        return res.status(400).json({ error: "El email debe tener un formato válido" });
      }
      if (campos.cargo !== undefined && campos.cargo !== null && String(campos.cargo).trim().length > 50) {
        return res.status(400).json({ error: "El cargo no puede superar los 50 caracteres" });
      }
      if (campos.localidad !== undefined && !esTextoOpcionalValido(campos.localidad, 100)) {
        return res.status(400).json({ error: "La localidad debe ser un texto de hasta 100 caracteres" });
      }
      if (campos.provincia !== undefined && !esTextoOpcionalValido(campos.provincia, 100)) {
        return res.status(400).json({ error: "La provincia debe ser un texto de hasta 100 caracteres" });
      }
      if (campos.fecha_nacimiento !== undefined && !esFechaNacimientoOpcionalValida(campos.fecha_nacimiento)) {
        return res.status(400).json({ error: MSG_FECHA_NACIMIENTO });
      }

      const datos: DatosEmpleadoActualizar = {};
      if (campos.nombre !== undefined) datos.nombre = String(campos.nombre).trim();
      if (campos.apellido !== undefined) datos.apellido = String(campos.apellido).trim();
      if (campos.email !== undefined) datos.email = String(campos.email).trim();
      if (campos.cargo !== undefined) datos.cargo = campos.cargo === null ? null : String(campos.cargo).trim();
      if (campos.localidad !== undefined) datos.localidad = textoONull(campos.localidad);
      if (campos.provincia !== undefined) datos.provincia = textoONull(campos.provincia);
      if (campos.fecha_nacimiento !== undefined) datos.fecha_nacimiento = textoONull(campos.fecha_nacimiento);

      const empleado = await empleadosModel.actualizarParte(id, datos);
      res.status(200).json({ mensaje: "Empleado actualizado parcialmente con éxito", empleado });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /empleados/:id (Baja Lógica)
  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      await empleadosModel.eliminar(id);
      res.status(200).json({ mensaje: "Empleado eliminado con éxito" });
    } catch (error) {
      next(error);
    }
  }
}

export default new EmpleadosController();