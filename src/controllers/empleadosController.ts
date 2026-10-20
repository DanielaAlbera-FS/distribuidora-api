// Controller de empleados: valida datos, aplica el modelo y responde HTTP.
import type { Request, Response, NextFunction } from "express";
import empleadosModel from "../models/empleadosModel.js";
import type { DatosEmpleado, DatosEmpleadoActualizar } from "../models/empleadosModel.js";

type Cuerpo = Record<string, any>;

const esEmailValido = (valor: unknown): boolean => {
  if (typeof valor !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
};

const aId = (valor: unknown): number => {
  if (typeof valor === "string" && /^\d+$/.test(valor)) return Number(valor);
  return NaN;
};
const idValido = (id: number): boolean => Number.isInteger(id) && id > 0 && id <= 2147483647;

// Valida campos obligatorios y sus restricciones de tamaño
const validarEmpleado = (datos: Cuerpo): string | null => {
  const { nombre, apellido, email, cargo } = datos;

  if (!nombre || typeof nombre !== "string" || !nombre.trim() || nombre.trim().length > 100) {
    return "El nombre es obligatorio y debe tener entre 1 y 100 caracteres";
  }
  if (!apellido || typeof apellido !== "string" || !apellido.trim() || apellido.trim().length > 100) {
    return "El apellido es obligatorio y debe tener entre 1 y 100 caracteres";
  }
  if (!email || !esEmailValido(email) || String(email).trim().length > 100) {
    return "El email es obligatorio y debe tener un formato válido";
  }
  if (cargo !== undefined && cargo !== null && String(cargo).trim().length > 50) {
    return "El cargo no puede superar los 50 caracteres";
  }
  return null;
};

// Saneamiento de datos antes de enviar al modelo
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
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

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
      const datos: Cuerpo = req.body ?? {};
      const errorValidacion = validarEmpleado(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const empleado = await empleadosModel.crear(limpiarEmpleado(datos));
      res.status(201).json({ mensaje: "Empleado creado con éxito", id: empleado.id });
    } catch (error) {
      next(error); // El middleware captura P2002 si el email está duplicado
    }
  }

  // PUT /empleados/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const datos: Cuerpo = req.body ?? {};
      const errorValidacion = validarEmpleado(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const empleado = await empleadosModel.actualizar(id, limpiarEmpleado(datos));
      res.status(200).json({ mensaje: "Empleado actualizado con éxito", empleado });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /empleados/:id
  async actualizarParte(req: Request, res: Response, next: NextFunction) {
    try {
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const campos: Cuerpo = req.body ?? {};
      const camposPermitidos = ["nombre", "apellido", "email", "cargo"];
      const keys = Object.keys(campos).filter((key) => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: "No se enviaron campos válidos para actualizar" });
      }

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
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      await empleadosModel.eliminar(id);
      res.status(200).json({ mensaje: "Empleado eliminado con éxito" });
    } catch (error) {
      next(error);
    }
  }
}

export default new EmpleadosController();