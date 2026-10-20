// Controller de clientes: valida lo que llega, llama al model y arma la respuesta HTTP.
import type { Request, Response, NextFunction } from "express";
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

// ID de la URL: entero positivo. Devuelve NaN si no es válido.
const aId = (valor: unknown): number => {
  if (typeof valor === "string" && /^\d+$/.test(valor)) return Number(valor);
  return NaN;
};
const idValido = (id: number): boolean => Number.isInteger(id) && id > 0 && id <= 2147483647;

// Valida el cliente completo (POST y PUT). Devuelve el mensaje de error o null si está todo bien.
const validarCliente = (datos: Cuerpo): string | null => {
  const { nombre, email, CUIL_CUIT } = datos;

  if (!nombre || typeof nombre !== "string" || nombre.trim() === "" || nombre.trim().length > 100) {
    return "El nombre es obligatorio y debe tener entre 1 y 100 caracteres";
  }
  if (!email || !esEmailValido(email) || String(email).trim().length > 100) {
    return "El email es obligatorio y debe tener un formato válido";
  }
  if (!CUIL_CUIT || !esCuitValido(CUIL_CUIT)) {
    return "El CUIL/CUIT es obligatorio y debe tener 11 números (se admiten guiones)";
  }
  if (datos.telefono && String(datos.telefono).trim().length > 20) {
    return "El teléfono no puede superar los 20 caracteres";
  }
  if (datos.direccion && String(datos.direccion).trim().length > 150) {
    return "La dirección no puede superar los 150 caracteres";
  }
  return null;
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
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

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
      const datos: Cuerpo = req.body ?? {};
      const errorValidacion = validarCliente(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const cliente = await clientesModel.crear(limpiarCliente(datos));

      res.status(201).json({ mensaje: "Cliente creado con éxito", id: cliente.id });
    } catch (error) {
      next(error); // P2002 si el CUIL/CUIT está duplicado
    }
  }

  // PUT /clientes/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const datos: Cuerpo = req.body ?? {};
      const errorValidacion = validarCliente(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const cliente = await clientesModel.actualizar(id, limpiarCliente(datos)); // P2025 si no existe -> 404

      res.status(200).json({ mensaje: "Cliente actualizado con éxito", cliente });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /clientes/:id
  async actualizarParte(req: Request, res: Response, next: NextFunction) {
    try {
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

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
      const id = aId(req.params.id);
      if (!idValido(id)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      await clientesModel.eliminar(id); // P2025 si no existe (404), P2003 si tiene pedidos (400)

      res.status(200).json({ mensaje: "Cliente eliminado con éxito" });
    } catch (error) {
      next(error);
    }
  }
}

export default new ClientesController();