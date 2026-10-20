// Controller de pedidos y de su detalle: valida lo que llega, llama al model y arma la respuesta HTTP.
import type { Request, Response, NextFunction } from "express";
import pedidosModel from "../models/pedidosModel.js";
import type { DatosPedido, EstadoPedido } from "../models/pedidosModel.js";

const MAX_INT = 2147483647; // Tope de un INT de MySQL.
const MAX_PRECIO = 99999999.99; // Tope de DECIMAL(10,2).
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

// Type guard: además de comprobar, le avisa a TypeScript que el valor es un EstadoPedido.
const esEstado = (valor: unknown): valor is EstadoPedido =>
  typeof valor === "string" && ESTADOS_VALIDOS.includes(valor as EstadoPedido);

// Lee el código de un error de Prisma (P2002, P2003, P2025...) o devuelve undefined si no tiene.
const codigoPrisma = (error: unknown): string | undefined =>
  typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : undefined;

// Valida el pedido completo (POST y PUT). Devuelve el mensaje de error o null si está todo bien.
const validarPedido = (datos: Cuerpo, exigirEstado: boolean): string | null => {
  const { fecha, estado, id_cliente, id_empleado, id_compania_envio } = datos;

  if (
    fecha === undefined ||
    id_cliente === undefined ||
    id_empleado === undefined ||
    id_compania_envio === undefined ||
    (exigirEstado && estado === undefined)
  ) {
    return "Faltan campos obligatorios: fecha, estado, id_cliente, id_empleado e id_compania_envio";
  }
  if (!esFechaValida(fecha)) {
    return "La fecha debe ser válida y tener formato AAAA-MM-DD";
  }
  if (estado !== undefined && !esEstado(estado)) {
    return `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`;
  }
  if (!esEntero(id_cliente, 1)) {
    return "El id_cliente debe ser un número entero positivo";
  }
  if (!esEntero(id_empleado, 1)) {
    return "El id_empleado debe ser un número entero positivo";
  }
  if (!esEntero(id_compania_envio, 1)) {
    return "El id_compania_envio debe ser un número entero positivo";
  }
  return null;
};

// Valida cantidad y precio de una línea de detalle. Estas son las reglas que antes imponían los CHECK de la base.
const validarCantidadYPrecio = (cantidad: unknown, precioUnitario: unknown): string | null => {
  if (cantidad === undefined || precioUnitario === undefined) {
    return "Faltan campos obligatorios: cantidad y precio_unitario";
  }
  if (!esEntero(cantidad, 1)) {
    return "La cantidad debe ser un número entero positivo";
  }
  if (!esPrecioValido(precioUnitario)) {
    return "El precio_unitario debe ser un número positivo";
  }
  return null;
};

class PedidosController {
  // GET /pedidos?estado=&fecha=
  async consultar(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado, fecha } = req.query;

      if (estado !== undefined && !esEstado(estado)) {
        return res.status(400).json({ error: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}` });
      }
      if (fecha !== undefined && !esFechaValida(fecha)) {
        return res.status(400).json({ error: "La fecha debe ser válida y tener formato AAAA-MM-DD" });
      }

      // Después de las validaciones, TypeScript ya sabe que estado es un EstadoPedido y fecha un texto.
      const filas = await pedidosModel.obtenerTodos(estado, fecha as string | undefined);

      res.status(200).json({ total: filas.length, pedidos: filas });
    } catch (error) {
      next(error);
    }
  }

  // GET /pedidos/:id
  async consultarDetalle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const pedido = await pedidosModel.obtenerPorId(Number(id));
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
      const datos: Cuerpo = req.body ?? {};
      const errorValidacion = validarPedido(datos, false);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

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
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const datos: Cuerpo = req.body ?? {};
      const errorValidacion = validarPedido(datos, true);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

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

      await pedidosModel.actualizar(Number(id), datosLimpios); // si el id no existe: P2025
      const pedido = await pedidosModel.obtenerPorId(Number(id)); // lo releemos para devolverlo con los nombres

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
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

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
      await pedidosModel.actualizarParte(Number(id), datos); // si el id no existe: P2025
      const pedido = await pedidosModel.obtenerPorId(Number(id));

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
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      await pedidosModel.eliminar(Number(id)); // sus líneas se borran en cascada; P2025 si no existe

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
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }
      if (!(await pedidosModel.existe(Number(id)))) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      const total = await pedidosModel.obtenerTotal(Number(id));

      res.status(200).json({ id_pedido: Number(id), total });
    } catch (error) {
      next(error);
    }
  }

  // GET /pedidos/:id/detalle
  async consultarLineas(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }
      if (!(await pedidosModel.existe(Number(id)))) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      const lineas = await pedidosModel.obtenerLineas(Number(id));

      res.status(200).json({ id_pedido: Number(id), lineas });
    } catch (error) {
      next(error);
    }
  }

  // POST /pedidos/:id/detalle
  async ingresarLinea(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: "El ID debe ser un número entero positivo" });
      }

      const { id_producto, cantidad, precio_unitario }: Cuerpo = req.body ?? {};
      if (id_producto === undefined) {
        return res.status(400).json({ error: "Faltan campos obligatorios: id_producto, cantidad y precio_unitario" });
      }
      if (!esEntero(id_producto, 1)) {
        return res.status(400).json({ error: "El id_producto debe ser un número entero positivo" });
      }
      const errorValidacion = validarCantidadYPrecio(cantidad, precio_unitario);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      // Se comprueba antes que el pedido exista: si no, la clave foránea daría un 400 en lugar del 404.
      if (!(await pedidosModel.existe(Number(id)))) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      await pedidosModel.crearLinea(Number(id), Number(id_producto), Number(cantidad), Number(precio_unitario));

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
      const { id, id_producto } = req.params;
      if (!esEntero(id, 1) || !esEntero(id_producto, 1)) {
        return res.status(400).json({ error: "El ID del pedido y el ID del producto deben ser enteros positivos" });
      }

      const { cantidad, precio_unitario }: Cuerpo = req.body ?? {};
      const errorValidacion = validarCantidadYPrecio(cantidad, precio_unitario);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      if (!(await pedidosModel.existe(Number(id)))) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      await pedidosModel.actualizarLinea(Number(id), Number(id_producto), Number(cantidad), Number(precio_unitario));

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
      const { id, id_producto } = req.params;
      if (!esEntero(id, 1) || !esEntero(id_producto, 1)) {
        return res.status(400).json({ error: "El ID del pedido y el ID del producto deben ser enteros positivos" });
      }

      if (!(await pedidosModel.existe(Number(id)))) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      await pedidosModel.eliminarLinea(Number(id), Number(id_producto));

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