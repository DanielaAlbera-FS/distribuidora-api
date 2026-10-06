import pedidosModel from '../models/pedidosModel.mjs';

const MAX_INT = 2147483647;
const MAX_PRECIO = 99999999.99;
const ESTADOS_VALIDOS = ['pendiente', 'enviado', 'entregado'];

const aNumero = (valor) => {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && /^\d+(\.\d+)?$/.test(valor.trim())) return Number(valor);
  return NaN;
};

const esEntero = (valor, minimo) => {
  const numero = aNumero(valor);
  return Number.isInteger(numero) && numero >= minimo && numero <= MAX_INT;
};

const esPrecioValido = (valor) => {
  const numero = aNumero(valor);
  return Number.isFinite(numero) && numero > 0 && numero <= MAX_PRECIO;
};

const esFechaValida = (valor) => {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};

const validarPedido = (datos, exigirEstado = false) => {
  const { fecha, estado, id_cliente, id_empleado, id_compania_envio } = datos;

  if (
    fecha === undefined ||
    id_cliente === undefined ||
    id_empleado === undefined ||
    id_compania_envio === undefined ||
    (exigirEstado && estado === undefined)
  ) {
    return 'Faltan campos obligatorios: fecha, estado, id_cliente, id_empleado e id_compania_envio';
  }
  if (!esFechaValida(fecha)) {
    return 'La fecha debe ser válida y tener formato AAAA-MM-DD';
  }
  if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
    return `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`;
  }
  if (!esEntero(id_cliente, 1)) {
    return 'El id_cliente debe ser un número entero positivo';
  }
  if (!esEntero(id_empleado, 1)) {
    return 'El id_empleado debe ser un número entero positivo';
  }
  if (!esEntero(id_compania_envio, 1)) {
    return 'El id_compania_envio debe ser un número entero positivo';
  }
  return null;
};

const validarCantidadYPrecio = (cantidad, precioUnitario) => {
  if (cantidad === undefined || precioUnitario === undefined) {
    return 'Faltan campos obligatorios: cantidad y precio_unitario';
  }
  if (!esEntero(cantidad, 1)) {
    return 'La cantidad debe ser un número entero positivo';
  }
  if (!esPrecioValido(precioUnitario)) {
    return 'El precio_unitario debe ser un número positivo';
  }
  return null;
};

const existePedido = async (id) => {
  const [filas] = await pedidosModel.obtenerPorId(id);
  return filas.length > 0;
};

class PedidosController {

  // GET /pedidos (?estado= & ?fecha=)
  async consultar(req, res, next) {
    try {
      const { estado, fecha } = req.query;

      if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({ error: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
      }
      if (fecha !== undefined && !esFechaValida(fecha)) {
        return res.status(400).json({ error: 'La fecha debe ser válida y tener formato AAAA-MM-DD' });
      }

      const [filas] = await pedidosModel.obtenerTodos(estado, fecha);
      res.status(200).json({
        total: filas.length,
        pedidos: filas
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /pedidos/:id
  async consultarDetalle(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El ID debe ser un número entero positivo' });
      }

      const [filas] = await pedidosModel.obtenerPorId(Number(id));
      if (filas.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      res.status(200).json(filas[0]);
    } catch (error) {
      next(error);
    }
  }

  // POST /pedidos
  async crear(req, res, next) {
    try {
      const datos = req.body ?? {};
      const errorValidacion = validarPedido(datos, false);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const datosLimpios = {
        fecha: datos.fecha,
        estado: datos.estado ?? 'pendiente',
        id_cliente: Number(datos.id_cliente),
        id_empleado: Number(datos.id_empleado),
        id_compania_envio: Number(datos.id_compania_envio)
      };

      const [resultado] = await pedidosModel.crear(datosLimpios);

      res.status(201).json({
        mensaje: 'Pedido creado con éxito',
        id: resultado.insertId
      });
    } catch (error) {
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
        return res.status(400).json({ error: 'Uno de los IDs ingresados (cliente, empleado o compañía de envío) no existe' });
      }
      next(error);
    }
  }

  // PUT /pedidos/:id
  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El ID debe ser un número entero positivo' });
      }

      const datos = req.body ?? {};
      const errorValidacion = validarPedido(datos, true);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const datosLimpios = {
        fecha: datos.fecha,
        estado: datos.estado,
        id_cliente: Number(datos.id_cliente),
        id_empleado: Number(datos.id_empleado),
        id_compania_envio: Number(datos.id_compania_envio)
      };

      const [resultado] = await pedidosModel.actualizar(Number(id), datosLimpios);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const [filas] = await pedidosModel.obtenerPorId(Number(id));

      res.status(200).json({
        mensaje: 'Pedido actualizado con éxito',
        pedido: filas[0]
      });
    } catch (error) {
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
        return res.status(400).json({ error: 'Uno de los IDs ingresados (cliente, empleado o compañía de envío) no existe' });
      }
      next(error);
    }
  }

  // PATCH /pedidos/:id
  async actualizarParte(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El ID debe ser un número entero positivo' });
      }

      const campos = req.body ?? {};
      const camposPermitidos = ['fecha', 'estado', 'id_cliente', 'id_empleado', 'id_compania_envio'];
      const keys = Object.keys(campos).filter(key => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: 'No se enviaron campos válidos para actualizar' });
      }

      if (campos.fecha !== undefined && !esFechaValida(campos.fecha)) {
        return res.status(400).json({ error: 'La fecha debe ser válida y tener formato AAAA-MM-DD' });
      }
      if (campos.estado !== undefined && !ESTADOS_VALIDOS.includes(campos.estado)) {
        return res.status(400).json({ error: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
      }
      if (campos.id_cliente !== undefined && !esEntero(campos.id_cliente, 1)) {
        return res.status(400).json({ error: 'El id_cliente debe ser un número entero positivo' });
      }
      if (campos.id_empleado !== undefined && !esEntero(campos.id_empleado, 1)) {
        return res.status(400).json({ error: 'El id_empleado debe ser un número entero positivo' });
      }
      if (campos.id_compania_envio !== undefined && !esEntero(campos.id_compania_envio, 1)) {
        return res.status(400).json({ error: 'El id_compania_envio debe ser un número entero positivo' });
      }

      const setClause = keys.map(key => `${key}=?`).join(', ');
      const values = keys.map(key => ['id_cliente', 'id_empleado', 'id_compania_envio'].includes(key) ? Number(campos[key]) : campos[key]);

      const [resultado] = await pedidosModel.actualizarParte(Number(id), setClause, values);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const [filas] = await pedidosModel.obtenerPorId(Number(id));

      res.status(200).json({
        mensaje: 'Pedido actualizado parcialmente con éxito',
        pedido: filas[0]
      });
    } catch (error) {
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
        return res.status(400).json({ error: 'Uno de los IDs ingresados no existe' });
      }
      next(error);
    }
  }

  // DELETE /pedidos/:id
  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El ID debe ser un número entero positivo' });
      }

      const [resultado] = await pedidosModel.eliminar(Number(id));
      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      res.status(200).json({ mensaje: 'Pedido eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  }

  // GET /pedidos/:id/total
  async consultarTotal(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El ID debe ser un número entero positivo' });
      }
      if (!(await existePedido(Number(id)))) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const [filas] = await pedidosModel.obtenerTotal(Number(id));
      res.status(200).json({
        id_pedido: Number(id),
        total: filas[0].total
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /pedidos/:id/detalle
  async consultarLineas(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El ID debe ser un número entero positivo' });
      }
      if (!(await existePedido(Number(id)))) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const [filas] = await pedidosModel.obtenerLineas(Number(id));
      res.status(200).json({
        id_pedido: Number(id),
        lineas: filas
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /pedidos/:id/detalle
  async ingresarLinea(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El ID debe ser un número entero positivo' });
      }

      const { id_producto, cantidad, precio_unitario } = req.body ?? {};
      if (id_producto === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: id_producto, cantidad y precio_unitario' });
      }
      if (!esEntero(id_producto, 1)) {
        return res.status(400).json({ error: 'El id_producto debe ser un número entero positivo' });
      }
      const errorValidacion = validarCantidadYPrecio(cantidad, precio_unitario);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      if (!(await existePedido(Number(id)))) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      await pedidosModel.crearLinea(
        Number(id),
        Number(id_producto),
        Number(cantidad),
        Number(precio_unitario)
      );

      res.status(201).json({ mensaje: 'Línea agregada al pedido con éxito' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        return res.status(400).json({ error: 'El producto ya está incluido en el detalle de este pedido' });
      }
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
        return res.status(400).json({ error: 'El id_producto especificado no existe' });
      }
      next(error);
    }
  }

  // PUT /pedidos/:id/detalle/:id_producto
  async actualizarLinea(req, res, next) {
    try {
      const { id, id_producto } = req.params;
      if (!esEntero(id, 1) || !esEntero(id_producto, 1)) {
        return res.status(400).json({ error: 'El ID del pedido y el ID del producto deben ser enteros positivos' });
      }

      const { cantidad, precio_unitario } = req.body ?? {};
      const errorValidacion = validarCantidadYPrecio(cantidad, precio_unitario);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      if (!(await existePedido(Number(id)))) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const [resultado] = await pedidosModel.actualizarLinea(
        Number(id),
        Number(id_producto),
        Number(cantidad),
        Number(precio_unitario)
      );

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'El producto no figura en el pedido' });
      }

      res.status(200).json({ mensaje: 'Línea del pedido actualizada con éxito' });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /pedidos/:id/detalle/:id_producto
  async eliminarLinea(req, res, next) {
    try {
      const { id, id_producto } = req.params;
      if (!esEntero(id, 1) || !esEntero(id_producto, 1)) {
        return res.status(400).json({ error: 'El ID del pedido y el ID del producto deben ser enteros positivos' });
      }

      if (!(await existePedido(Number(id)))) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const [resultado] = await pedidosModel.eliminarLinea(Number(id), Number(id_producto));
      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'El producto no figura en el pedido' });
      }

      res.status(200).json({ mensaje: 'Línea eliminada del pedido con éxito' });
    } catch (error) {
      next(error);
    }
  }
}

export default new PedidosController();