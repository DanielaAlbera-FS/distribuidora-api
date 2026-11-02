// Controller de pedidos y de su detalle: revisa el resultado de la validación, llama al model y arma la respuesta HTTP.
import type { Request, Response, NextFunction } from "express";
import { validationResult, matchedData } from "express-validator";
import pedidosModel from "../models/pedidosModel.js";
import type { DatosPedido, EstadoPedido } from "../models/pedidosModel.js";

const MAX_INT = 2147483647; // Tope de un INT de MySQL.
const ESTADOS_VALIDOS: EstadoPedido[] = ["pendiente", "enviado", "entregado"]; // Los tres estados del enum.

// Cuerpo de la petición: llega sin tipo, así que lo tratamos como un objeto cualquiera.
type Cuerpo = Record<string, any>;

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

// Fecha AAAA-MM-DD que exista de verdad (rechaza, por ejemplo, 2026-02-31).
const esFechaValida = (valor: unknown): boolean => {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};

// Type guard: además de comprobar, le avisa a TypeScript que el valor es un EstadoPedido.
const esEstado = (valor: unknown): valor is EstadoPedido =>
  typeof valor === "string" && ESTADOS_VALIDOS.includes(valor as EstadoPedido);

// Lee el código de un error de Prisma (P2002, P2003, P2025...) o devuelve undefined si no tiene.
const codigoPrisma = (error: unknown): string | undefined =>
  typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : undefined;

// Revisa lo que dejó el checkSchema de la ruta (patrón de la clase: validationResult).
// Devuelve el cuerpo de la respuesta 400 si hubo errores, o null si todo está bien.
const errorDeValidacion = (req: Request) => {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return null;
  const errores = resultado.array();
  return { error: String(errores[0]?.msg), errores }; // "error" con el primer mensaje, como el resto de la API
};

class PedidosController {
  // GET /pedidos?estado=&fecha=
  async consultar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }

      // El esquema ya comprobó que estado es uno de los tres valores y que fecha es válida.
      const { estado, fecha } = req.query;
      const filas = await pedidosModel.obtenerTodos(estado as EstadoPedido | undefined, fecha as string | undefined);

      res.status(200).json({ total: filas.length, pedidos: filas });
    } catch (error) {
      next(error);
    }
  }

  // GET /pedidos/:id
  async consultarDetalle(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por el esquema

      const pedido = await pedidosModel.obtenerPorId(id);
      if (pedido === null) { // findUnique devuelve null si no existe.
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      res.status(200).json(pedido);
    } catch (error) {
      next(error);
    }
  }

  // POST /pedidos
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }

      // matchedData devuelve solo los campos del esquema.
      const datos: Cuerpo = matchedData(req, { locations: ["body"] });
      const datosLimpios: DatosPedido = {
        fecha: datos.fecha,
        estado: datos.estado ?? "pendiente", // si no mandan estado, arranca como pendiente
        id_cliente: Number(datos.id_cliente),
        id_empleado: Number(datos.id_empleado),
        id_compania_envio: Number(datos.id_compania_envio),
      };

    const errorBaja = await pedidosModel.verificarActivos(datosLimpios.id_cliente, datosLimpios.id_empleado);
      if (errorBaja) {
        return res.status(400).json({ error: errorBaja });
      }
    const pedido = await pedidosModel.crear(datosLimpios); // create devuelve el pedido con su id.

      res.status(201).json({ mensaje: "Pedido creado con éxito", id: pedido.id });
    } catch (error) {
      if (codigoPrisma(error) === "P2003") { // clave foránea: alguno de los tres ids no existe
        return res.status(400).json({ error: "Uno de los IDs ingresados (cliente, empleado o compañía de envío) no existe" });
      }
      next(error);
    }
  }

  // PUT /pedidos/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por el esquema

      // matchedData devuelve solo los campos del esquema.
      const datos: Cuerpo = matchedData(req, { locations: ["body"] });
      const datosLimpios: DatosPedido = {
        fecha: datos.fecha,
        estado: datos.estado,
        id_cliente: Number(datos.id_cliente),
        id_empleado: Number(datos.id_empleado),
        id_compania_envio: Number(datos.id_compania_envio),
      };
      const errorBaja = await pedidosModel.verificarActivos(datosLimpios.id_cliente, datosLimpios.id_empleado);
        if (errorBaja) {
          return res.status(400).json({ error: errorBaja });
        }

      await pedidosModel.actualizar(id, datosLimpios); // si el id no existe: P2025
      const pedido = await pedidosModel.obtenerPorId(id); // lo releemos para devolverlo con los nombres

      res.status(200).json({ mensaje: "Pedido actualizado con éxito", pedido });
    } catch (error) {
      if (codigoPrisma(error) === "P2025") {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }
      if (codigoPrisma(error) === "P2003") {
        return res.status(400).json({ error: "Uno de los IDs ingresados (cliente, empleado o compañía de envío) no existe" });
      }
      next(error);
    }
  }

  // PATCH /pedidos/:id
  async actualizarParte(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por el esquema

      const campos: Cuerpo = req.body ?? {};
      const camposPermitidos = ["fecha", "estado", "id_cliente", "id_empleado", "id_compania_envio"];
      const keys = Object.keys(campos).filter((key) => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: "No se enviaron campos válidos para actualizar" });
      }

      if (campos.fecha !== undefined && !esFechaValida(campos.fecha)) {
        return res.status(400).json({ error: "La fecha debe ser válida y tener formato AAAA-MM-DD" });
      }
      if (campos.estado !== undefined && !esEstado(campos.estado)) {
        return res.status(400).json({ error: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}` });
      }
      if (campos.id_cliente !== undefined && !esEntero(campos.id_cliente, 1)) {
        return res.status(400).json({ error: "El id_cliente debe ser un número entero positivo" });
      }
      if (campos.id_empleado !== undefined && !esEntero(campos.id_empleado, 1)) {
        return res.status(400).json({ error: "El id_empleado debe ser un número entero positivo" });
      }
      if (campos.id_compania_envio !== undefined && !esEntero(campos.id_compania_envio, 1)) {
        return res.status(400).json({ error: "El id_compania_envio debe ser un número entero positivo" });
      }

      // En vez de armar un SET con texto (como en TP4), armamos un objeto solo con los campos que llegaron.
      const datos: Partial<DatosPedido> = {};
      if (campos.fecha !== undefined) datos.fecha = campos.fecha;
      if (campos.estado !== undefined) datos.estado = campos.estado;
      if (campos.id_cliente !== undefined) datos.id_cliente = Number(campos.id_cliente);
      if (campos.id_empleado !== undefined) datos.id_empleado = Number(campos.id_empleado);
      if (campos.id_compania_envio !== undefined) datos.id_compania_envio = Number(campos.id_compania_envio);
      const errorBaja = await pedidosModel.verificarActivos(datos.id_cliente, datos.id_empleado);
        if (errorBaja) {
          return res.status(400).json({ error: errorBaja });
        }
      await pedidosModel.actualizarParte(id, datos); // si el id no existe: P2025
      const pedido = await pedidosModel.obtenerPorId(id);

      res.status(200).json({ mensaje: "Pedido actualizado parcialmente con éxito", pedido });
    } catch (error) {
      if (codigoPrisma(error) === "P2025") {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }
      if (codigoPrisma(error) === "P2003") {
        return res.status(400).json({ error: "Uno de los IDs ingresados no existe" });
      }
      next(error);
    }
  }

  // DELETE /pedidos/:id
  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por el esquema

      await pedidosModel.eliminar(id); // sus líneas se borran en cascada; P2025 si no existe

      res.status(200).json({ mensaje: "Pedido eliminado con éxito" });
    } catch (error) {
      if (codigoPrisma(error) === "P2025") {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }
      next(error);
    }
  }

  // GET /pedidos/:id/total
  async consultarTotal(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por el esquema
      if (!(await pedidosModel.existe(id))) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      const total = await pedidosModel.obtenerTotal(id);

      res.status(200).json({ id_pedido: id, total });
    } catch (error) {
      next(error);
    }
  }

  // GET /pedidos/:id/detalle
  async consultarLineas(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por el esquema
      if (!(await pedidosModel.existe(id))) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      const lineas = await pedidosModel.obtenerLineas(id);

      res.status(200).json({ id_pedido: id, lineas });
    } catch (error) {
      next(error);
    }
  }

  // POST /pedidos/:id/detalle
  async ingresarLinea(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validado como entero positivo por el esquema

      const { id_producto, cantidad, precio_unitario }: Cuerpo = matchedData(req, { locations: ["body"] });

      // Se comprueba antes que el pedido exista: si no, la clave foránea daría un 400 en lugar del 404.
      if (!(await pedidosModel.existe(id))) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      await pedidosModel.crearLinea(id, Number(id_producto), Number(cantidad), Number(precio_unitario));

      res.status(201).json({ mensaje: "Línea agregada al pedido con éxito" });
    } catch (error) {
      if (codigoPrisma(error) === "P2002") { // la clave compuesta (pedido, producto) ya existe
        return res.status(400).json({ error: "El producto ya está incluido en el detalle de este pedido" });
      }
      if (codigoPrisma(error) === "P2003") { // el producto no existe
        return res.status(400).json({ error: "El id_producto especificado no existe" });
      }
      next(error);
    }
  }

  // PUT /pedidos/:id/detalle/:id_producto
  async actualizarLinea(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validados como enteros positivos por el esquema
      const idProducto = Number(req.params.id_producto);

      const { cantidad, precio_unitario }: Cuerpo = matchedData(req, { locations: ["body"] });

      if (!(await pedidosModel.existe(id))) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      await pedidosModel.actualizarLinea(id, idProducto, Number(cantidad), Number(precio_unitario));

      res.status(200).json({ mensaje: "Línea del pedido actualizada con éxito" });
    } catch (error) {
      if (codigoPrisma(error) === "P2025") { // el pedido existe pero esa línea no
        return res.status(404).json({ error: "El producto no figura en el pedido" });
      }
      next(error);
    }
  }

  // DELETE /pedidos/:id/detalle/:id_producto
  async eliminarLinea(req: Request, res: Response, next: NextFunction) {
    try {
      const errorValidacion = errorDeValidacion(req);
      if (errorValidacion) {
        return res.status(400).json(errorValidacion);
      }
      const id = Number(req.params.id); // ya validados como enteros positivos por el esquema
      const idProducto = Number(req.params.id_producto);

      if (!(await pedidosModel.existe(id))) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      await pedidosModel.eliminarLinea(id, idProducto);

      res.status(200).json({ mensaje: "Línea eliminada del pedido con éxito" });
    } catch (error) {
      if (codigoPrisma(error) === "P2025") {
        return res.status(404).json({ error: "El producto no figura en el pedido" });
      }
      next(error);
    }
  }
}

export default new PedidosController();