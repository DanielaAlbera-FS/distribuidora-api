// Controller de clientes: revisa el resultado de la validación, llama al model y arma la respuesta HTTP.
import type { Request, Response, NextFunction } from "express";
import { validationResult, matchedData } from "express-validator";
import clientesModel from "../models/clientesModel.js";
import type { DatosCliente, DatosClienteActualizar } from "../models/clientesModel.js";

// Cuerpo de la petición: llega sin tipo, así que lo tratamos como un objeto cualquiera.
type Cuerpo = Record<string, any>;

// Acepta el CUIL/CUIT con o sin guiones (20-98765432-1 o 20987654321): debe tener 11 números.
const esCuitValido = (valor: unknown): boolean => {
  if (typeof valor !== "string") return false;
  return /^\d{11}$/.test(valor.trim().replace(/-/g, ""));
};

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

// Arma el objeto limpio (texto sin espacios sobrantes) agregando solo las propiedades presentes.
const limpiarCliente = (datos: Cuerpo): DatosCliente => {
  const objetoLimpio: DatosCliente = {
    nombre: String(datos.nombre).trim(),
    email: String(datos.email).trim(),
    CUIL_CUIT: String(datos.CUIL_CUIT).trim(),
  };

  if (datos.telefono !== undefined && datos.telefono !== null && datos.telefono !== "") {
    objetoLimpio.telefono = String(datos.telefono).trim();
  }
  if (datos.direccion !== undefined && datos.direccion !== null && datos.direccion !== "") {
    objetoLimpio.direccion = String(datos.direccion).trim();
  }
  return objetoLimpio;
};

class ClientesController {
  // GET /clientes?nombre=texto
  async consultar(req: Request, res: Response, next: NextFunction) {
    try {
      const { nombre } = req.query;

      if (nombre !== undefined && (typeof nombre !== "string" || nombre.trim() === "")) {
        return res.status(400).json({ error: "El parámetro nombre debe ser un texto no vacío" });
      }

      const clientes = await clientesModel.obtenerTodos(nombre?.trim());
      res.status(200).json({ total: clientes.length, clientes });
    } catch (error) {
      next(error);
    }
  }

  // GET /clientes/:id
  async consultarDetalle(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      const cliente = await clientesModel.obtenerPorId(id);
      if (cliente === null) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      res.status(200).json(cliente);
    } catch (error) {
      next(error);
    }
  }

  // POST /clientes
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }

      // matchedData devuelve solo los campos del esquema, ya recortados por trim.
      const datos: Cuerpo = matchedData(req, { locations: ["body"] });
      const cliente = await clientesModel.crear(limpiarCliente(datos));

      res.status(201).json({ mensaje: "Cliente creado con éxito", id: cliente.id });
    } catch (error) {
      next(error); // P2002 si el CUIL/CUIT está duplicado
    }
  }

  // PUT /clientes/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      // matchedData devuelve solo los campos del esquema, ya recortados por trim.
      const datos: Cuerpo = matchedData(req, { locations: ["body"] });
      const cliente = await clientesModel.actualizar(id, limpiarCliente(datos)); // P2025 si no existe -> 404

      res.status(200).json({ mensaje: "Cliente actualizado con éxito", cliente });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /clientes/:id
  async actualizarParte(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      const campos: Cuerpo = req.body ?? {};
      const camposPermitidos = ["nombre", "telefono", "email", "direccion", "CUIL_CUIT"];
      const keys = Object.keys(campos).filter((key) => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: "No se enviaron campos válidos para actualizar" });
      }

      // Los campos obligatorios, si llegan, deben seguir siendo válidos.
      if (campos.nombre !== undefined && (typeof campos.nombre !== "string" || !campos.nombre.trim() || campos.nombre.trim().length > 100)) {
        return res.status(400).json({ error: "El nombre debe ser un texto de 1 a 100 caracteres" });
      }
      if (campos.email !== undefined && !esEmailValido(campos.email)) {
        return res.status(400).json({ error: "El email debe tener un formato válido" });
      }
      if (campos.CUIL_CUIT !== undefined && !esCuitValido(campos.CUIL_CUIT)) {
        return res.status(400).json({ error: "El CUIL/CUIT debe tener 11 números (se admiten guiones)" });
      }

      // En vez de armar un SET con texto (como en TP4), armamos un objeto solo con los campos que llegaron.
      const datos: DatosClienteActualizar = {};
      if (campos.nombre !== undefined) datos.nombre = String(campos.nombre).trim();
      if (campos.email !== undefined) datos.email = String(campos.email).trim();
      if (campos.CUIL_CUIT !== undefined) datos.CUIL_CUIT = String(campos.CUIL_CUIT).trim();
      if (campos.telefono !== undefined) datos.telefono = campos.telefono === null ? null : String(campos.telefono).trim();
      if (campos.direccion !== undefined) datos.direccion = campos.direccion === null ? null : String(campos.direccion).trim();

      const cliente = await clientesModel.actualizarParte(id, datos); // P2025 si no existe -> 404

      res.status(200).json({ mensaje: "Cliente actualizado parcialmente con éxito", cliente });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /clientes/:id
  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por idValidationSchema

      await clientesModel.eliminar(id); // P2025 si no existe (404), P2003 si tiene pedidos (400)

      res.status(200).json({ mensaje: "Cliente eliminado con éxito" });
    } catch (error) {
      next(error);
    }
  }
}

export default new ClientesController();