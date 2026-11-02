// Controller de empleados: revisa el resultado de la validación, llama al model y arma la respuesta HTTP.
import type { Request, Response, NextFunction } from "express";
import { validationResult, matchedData } from "express-validator";
import empleadosModel from "../models/empleadosModel.js";
import type { DatosEmpleado, DatosEmpleadoActualizar } from "../models/empleadosModel.js";

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

// Saneamiento de datos antes de enviar al modelo: agrega solo las propiedades presentes.
const limpiarEmpleado = (datos: Cuerpo): DatosEmpleado => {
  const objetoLimpio: DatosEmpleado = {
    nombre: String(datos.nombre).trim(),
    apellido: String(datos.apellido).trim(),
    email: String(datos.email).trim(),
  };

  if (datos.cargo !== undefined && datos.cargo !== null && datos.cargo !== "") {
    objetoLimpio.cargo = String(datos.cargo).trim();
  }
  return objetoLimpio;
};

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
      const camposPermitidos = ["nombre", "apellido", "email", "cargo"];
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

      const datos: DatosEmpleadoActualizar = {};
      if (campos.nombre !== undefined) datos.nombre = String(campos.nombre).trim();
      if (campos.apellido !== undefined) datos.apellido = String(campos.apellido).trim();
      if (campos.email !== undefined) datos.email = String(campos.email).trim();
      if (campos.cargo !== undefined) datos.cargo = campos.cargo === null ? null : String(campos.cargo).trim();

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